import { describe, expect, it } from 'vitest';
import { caseResponseSchema, type NewCompany, type NewHealthPersonnel } from '@/features/cases';
import { ApiError, apiRequest } from '@/shared/api/apiRequest';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { readDb } from '../db';

// F-002: the assigned case worker edits the case (SPEC.md F-002, "Case status").

const magnus = seedUser('magnus.berg@example.com'); // CaseWorker, dept 1, Health + Social
const MAGNUS = 'magnus.berg@example.com';

const newPerson: NewHealthPersonnel = {
  healthPersonnelNumber: '9000777',
  firstName: 'Fakefirst',
  surname: 'Fakelast',
  authorizations: [{ validFromDate: '2021-05-01', validToDate: null, description: 'Physician' }],
};

function request(method: string, path: string, body?: unknown) {
  return apiRequest(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    schema: caseResponseSchema,
  });
}

const changeField = (id: string, field: string) =>
  request('PATCH', `/api/cases/${id}/field`, { field });
const addPerson = (id: string, person: unknown) =>
  request('POST', `/api/cases/${id}/health-personnel`, person);
const removePerson = (id: string, personId: string) =>
  request('DELETE', `/api/cases/${id}/health-personnel/${personId}`);

function assignedCase(overrides = {}) {
  return makeCase({
    departmentId: 1,
    field: 'Health',
    status: 'Assigned',
    assignedTo: magnus.id,
    ...overrides,
  });
}

describe('F-002 first change moves the case to InProgress', () => {
  it('Assigned becomes InProgress, logged as "status changed" after "case updated"', async () => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    const response = await changeField(target.id, 'Social');

    expect(response.supervisionCase.status).toBe('InProgress');
    expect(readDb().auditLog).toMatchObject([
      {
        action: 'CaseUpdated',
        result: 'Success',
        details: { change: 'FieldChanged', to: 'Social' },
      },
      { action: 'StatusChanged', details: { from: 'Assigned', to: 'InProgress' } },
    ]);
  });

  it('a later change keeps InProgress and logs no status change', async () => {
    const target = assignedCase({ status: 'InProgress' });
    storeCases(target);
    actAs(MAGNUS);

    await addPerson(target.id, newPerson);

    expect(readDb().cases[0]?.status).toBe('InProgress');
    expect(readDb().auditLog.map((entry) => entry.action)).toEqual(['CaseUpdated']);
  });
});

describe('F-002 PATCH /api/cases/:id/field', () => {
  it('changes the field to one of the case worker’s fields', async () => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    const response = await changeField(target.id, 'Social');

    expect(response.supervisionCase.field).toBe('Social');
    expect(readDb().cases[0]?.field).toBe('Social');
  });

  it.each([
    ['a field the case worker does not have', 'ChildServices'],
    ['the field the case already has', 'Health'],
    ['an unknown field', 'Space'],
  ])('rejects %s with 400', async (_label, field) => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    await expect(changeField(target.id, field)).rejects.toEqual(
      new ApiError(400, `/api/cases/${target.id}/field`),
    );
    expect(readDb().cases[0]).toEqual(target);
  });
});

describe('F-002 POST /api/cases/:id/health-personnel', () => {
  it('adds the health personnel with an id and no reaction yet', async () => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    const response = await addPerson(target.id, newPerson);

    expect(response.access).toBe('full');
    const people = response.access === 'full' ? response.supervisionCase.healthPersonnel : [];
    expect(people).toEqual([{ id: expect.any(String) as unknown, ...newPerson }]);
    expect(readDb().auditLog[0]).toMatchObject({
      action: 'CaseUpdated',
      details: { change: 'HealthPersonnelAdded', healthPersonnelId: people[0]?.id },
    });
  });

  it('never puts the person’s name or number in the audit log', async () => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    await addPerson(target.id, newPerson);

    const log = JSON.stringify(readDb().auditLog);
    for (const value of ['9000777', 'Fakefirst', 'Fakelast', 'Physician', '2021-05-01']) {
      expect(log).not.toContain(value);
    }
  });

  it('rejects the same health personnel number twice with 409', async () => {
    const target = assignedCase({
      healthPersonnel: [makeHealthPersonnel({ healthPersonnelNumber: '9000777' })],
    });
    storeCases(target);
    actAs(MAGNUS);

    await expect(addPerson(target.id, newPerson)).rejects.toEqual(
      new ApiError(409, `/api/cases/${target.id}/health-personnel`),
    );
    expect(readDb().cases[0]?.healthPersonnel).toHaveLength(1);
  });

  it.each([
    ['a number with 6 digits', { ...newPerson, healthPersonnelNumber: '123456' }],
    ['a number with letters', { ...newPerson, healthPersonnelNumber: '12345a7' }],
    ['no first name', { ...newPerson, firstName: '' }],
    ['no authorizations', { ...newPerson, authorizations: [] }],
    [
      'valid to before valid from',
      {
        ...newPerson,
        authorizations: [
          { validFromDate: '2021-05-01', validToDate: '2021-04-30', description: '' },
        ],
      },
    ],
  ])('rejects %s with 400', async (_label, person) => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    await expect(addPerson(target.id, person)).rejects.toEqual(
      new ApiError(400, `/api/cases/${target.id}/health-personnel`),
    );
    expect(readDb().cases[0]).toEqual(target);
  });
});

describe('F-002 DELETE /api/cases/:id/health-personnel/:personId', () => {
  it('removes the health personnel and logs it by id only', async () => {
    const person = makeHealthPersonnel({ firstName: 'Removedfirst' });
    const target = assignedCase({ status: 'InProgress', healthPersonnel: [person] });
    storeCases(target);
    actAs(MAGNUS);

    await removePerson(target.id, person.id);

    expect(readDb().cases[0]?.healthPersonnel).toEqual([]);
    expect(readDb().auditLog[0]).toMatchObject({
      details: { change: 'HealthPersonnelRemoved', healthPersonnelId: person.id },
    });
    expect(JSON.stringify(readDb().auditLog)).not.toContain('Removedfirst');
  });

  it('rejects a person who is not on the case with 400', async () => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    await expect(removePerson(target.id, crypto.randomUUID())).rejects.toBeInstanceOf(ApiError);
  });
});

describe('F-002 only the assigned case worker can edit', () => {
  it.each([
    ['another case worker', TINE_CASE_WORKER_DEPT_1, () => assignedCase()],
    ['the leader', INGRID_LEADER_DEPT_1, () => assignedCase()],
    ['an admin', LARS_ADMIN, () => assignedCase()],
    ['the case worker, when the case is closed', MAGNUS, () => assignedCase({ status: 'Closed' })],
  ])('refuses %s with 403, logs Denied and changes nothing', async (_label, email, make) => {
    const target = make();
    storeCases(target);
    const user = actAs(email);

    await expect(changeField(target.id, 'Social')).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/field`),
    );
    await expect(addPerson(target.id, newPerson)).rejects.toBeInstanceOf(ApiError);
    expect(readDb().cases[0]).toEqual(target);
    expect(readDb().auditLog).toMatchObject([
      {
        userId: user.id,
        action: 'CaseUpdated',
        result: 'Denied',
        details: { change: 'FieldChanged' },
      },
      {
        userId: user.id,
        action: 'CaseUpdated',
        result: 'Denied',
        details: { change: 'HealthPersonnelAdded' },
      },
    ]);
    expect(JSON.stringify(readDb().auditLog)).not.toContain('9000777');
  });

  it('answers 404 for a case that does not exist', async () => {
    actAs(MAGNUS);
    const id = crypto.randomUUID();

    await expect(changeField(id, 'Social')).rejects.toEqual(
      new ApiError(404, `/api/cases/${id}/field`),
    );
  });
});

describe('F-002 companies', () => {
  const newCompany: NewCompany = {
    organizationNumber: '900000777',
    name: 'Fake Clinic',
    description: 'Outpatient clinic',
    address: {
      streetName: 'Fake Street 3',
      zipCode: '0456',
      state: 'Fake State',
      country: 'Norway',
    },
  };
  const addCompany = (id: string, company: unknown) =>
    request('POST', `/api/cases/${id}/companies`, company);
  const removeCompany = (id: string, companyId: string) =>
    request('DELETE', `/api/cases/${id}/companies/${companyId}`);

  it('adds a company with an id and no reaction yet, logged by id only', async () => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    const response = await addCompany(target.id, newCompany);

    const companies = response.access === 'full' ? response.supervisionCase.companies : [];
    expect(companies).toEqual([{ id: expect.any(String) as unknown, ...newCompany }]);
    expect(response.supervisionCase.status).toBe('InProgress');
    expect(readDb().auditLog[0]).toMatchObject({
      action: 'CaseUpdated',
      details: { change: 'CompanyAdded', companyId: companies[0]?.id },
    });
    const log = JSON.stringify(readDb().auditLog);
    for (const value of [
      '900000777',
      'Fake Clinic',
      'Outpatient clinic',
      'Fake Street 3',
      '0456',
    ]) {
      expect(log).not.toContain(value);
    }
  });

  it('rejects the same organization number twice with 409', async () => {
    const target = assignedCase({
      companies: [makeCompany({ organizationNumber: '900000777' })],
    });
    storeCases(target);
    actAs(MAGNUS);

    await expect(addCompany(target.id, newCompany)).rejects.toEqual(
      new ApiError(409, `/api/cases/${target.id}/companies`),
    );
  });

  it.each([
    ['an organization number with 8 digits', { ...newCompany, organizationNumber: '12345678' }],
    ['an organization number with spaces', { ...newCompany, organizationNumber: '900 000 777' }],
    ['no name', { ...newCompany, name: '' }],
    ['no street name', { ...newCompany, address: { ...newCompany.address, streetName: '' } }],
    ['no country', { ...newCompany, address: { ...newCompany.address, country: '' } }],
  ])('rejects %s with 400', async (_label, company) => {
    const target = assignedCase();
    storeCases(target);
    actAs(MAGNUS);

    await expect(addCompany(target.id, company)).rejects.toEqual(
      new ApiError(400, `/api/cases/${target.id}/companies`),
    );
    expect(readDb().cases[0]).toEqual(target);
  });

  it('removes a company, logged by id without its details', async () => {
    const company = makeCompany({ name: 'Removed Clinic' });
    const target = assignedCase({ status: 'InProgress', companies: [company] });
    storeCases(target);
    actAs(MAGNUS);

    await removeCompany(target.id, company.id);

    expect(readDb().cases[0]?.companies).toEqual([]);
    expect(readDb().auditLog[0]).toMatchObject({
      details: { change: 'CompanyRemoved', companyId: company.id },
    });
    expect(JSON.stringify(readDb().auditLog)).not.toContain('Removed Clinic');
  });

  it('refuses the leader with 403 and logs Denied', async () => {
    const target = assignedCase();
    storeCases(target);
    actAs(INGRID_LEADER_DEPT_1);

    await expect(addCompany(target.id, newCompany)).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/companies`),
    );
    expect(readDb().auditLog).toMatchObject([
      { action: 'CaseUpdated', result: 'Denied', details: { change: 'CompanyAdded' } },
    ]);
  });
});

describe('F-002 reactions', () => {
  const person = makeHealthPersonnel({ firstName: 'Reactfirst' });
  const company = makeCompany({ name: 'React Clinic' });
  const personReaction = (caseId: string, personId: string, reaction: string) =>
    request('PUT', `/api/cases/${caseId}/health-personnel/${personId}/reaction`, { reaction });
  const companyReaction = (caseId: string, companyId: string, reaction: string) =>
    request('PUT', `/api/cases/${caseId}/companies/${companyId}/reaction`, { reaction });

  function caseWithParties(overrides = {}) {
    return assignedCase({ healthPersonnel: [person], companies: [company], ...overrides });
  }

  it.each(['NoReaction', 'Prohibition', 'RestrictionOfPractice'])(
    'gives a health personnel the reaction %s',
    async (reaction) => {
      const target = caseWithParties();
      storeCases(target);
      actAs(MAGNUS);

      const response = await personReaction(target.id, person.id, reaction);

      const people = response.access === 'full' ? response.supervisionCase.healthPersonnel : [];
      expect(people[0]?.reaction).toBe(reaction);
    },
  );

  it.each(['NoReaction', 'SelfAssessment'])('gives a company the reaction %s', async (reaction) => {
    const target = caseWithParties();
    storeCases(target);
    actAs(MAGNUS);

    const response = await companyReaction(target.id, company.id, reaction);

    const companies = response.access === 'full' ? response.supervisionCase.companies : [];
    expect(companies[0]?.reaction).toBe(reaction);
  });

  it('logs "reaction given" by id, without the reaction, and moves the case to In progress', async () => {
    const target = caseWithParties();
    storeCases(target);
    actAs(MAGNUS);

    await personReaction(target.id, person.id, 'RestrictionOfPractice');

    expect(readDb().cases[0]?.status).toBe('InProgress');
    expect(readDb().auditLog).toMatchObject([
      {
        action: 'ReactionGiven',
        result: 'Success',
        details: { change: 'HealthPersonnelReactionGiven', healthPersonnelId: person.id },
      },
      { action: 'StatusChanged', details: { from: 'Assigned', to: 'InProgress' } },
    ]);
    expect(JSON.stringify(readDb().auditLog)).not.toContain('RestrictionOfPractice');
  });

  it.each([
    [
      'a company reaction for a health personnel',
      () => personReaction,
      () => person.id,
      'SelfAssessment',
    ],
    [
      'a health personnel reaction for a company',
      () => companyReaction,
      () => company.id,
      'Prohibition',
    ],
    ['an unknown reaction', () => personReaction, () => person.id, 'Warning'],
    ['an unknown health personnel', () => personReaction, () => crypto.randomUUID(), 'NoReaction'],
  ])('rejects %s with 400', async (_label, endpoint, partyId, reaction) => {
    const target = caseWithParties();
    storeCases(target);
    actAs(MAGNUS);

    await expect(endpoint()(target.id, partyId(), reaction)).rejects.toBeInstanceOf(ApiError);
    expect(readDb().cases[0]).toEqual(target);
  });

  it('rejects giving the reaction the party already has', async () => {
    const target = caseWithParties({
      status: 'InProgress',
      healthPersonnel: [{ ...person, reaction: 'Prohibition' }],
    });
    storeCases(target);
    actAs(MAGNUS);

    await expect(personReaction(target.id, person.id, 'Prohibition')).rejects.toEqual(
      new ApiError(400, `/api/cases/${target.id}/health-personnel/${person.id}/reaction`),
    );
  });

  it('can change a reaction that was given earlier', async () => {
    const target = caseWithParties({
      status: 'InProgress',
      companies: [{ ...company, reaction: 'NoReaction' }],
    });
    storeCases(target);
    actAs(MAGNUS);

    await companyReaction(target.id, company.id, 'SelfAssessment');

    expect(readDb().cases[0]?.companies[0]?.reaction).toBe('SelfAssessment');
  });

  it('refuses anyone but the assigned case worker with 403 and logs Denied', async () => {
    const target = caseWithParties();
    storeCases(target);
    const leader = actAs(INGRID_LEADER_DEPT_1);

    await expect(personReaction(target.id, person.id, 'Prohibition')).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/health-personnel/${person.id}/reaction`),
    );
    expect(readDb().auditLog).toMatchObject([
      { userId: leader.id, action: 'ReactionGiven', result: 'Denied' },
    ]);
    expect(JSON.stringify(readDb().auditLog)).not.toContain('Prohibition');
  });
});
