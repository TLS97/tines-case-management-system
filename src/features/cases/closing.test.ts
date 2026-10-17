import { describe, expect, it } from 'vitest';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import { isReadyToClose, missingForClosing } from './closing';

describe('F-002 ready to close', () => {
  const personWith = makeHealthPersonnel({
    healthPersonnelNumber: '9000001',
    reaction: 'NoReaction',
  });
  const personWithout = makeHealthPersonnel({ healthPersonnelNumber: '9000002' });
  const companyWith = makeCompany({ organizationNumber: '900000001', reaction: 'SelfAssessment' });
  const companyWithout = makeCompany({ organizationNumber: '900000002' });

  it('is not ready without any health personnel or companies', () => {
    const empty = makeCase();

    expect(isReadyToClose(empty)).toBe(false);
    expect(missingForClosing(empty)).toEqual({
      noParties: true,
      healthPersonnelWithoutReaction: [],
      companiesWithoutReaction: [],
    });
  });

  it('is ready when every party has a reaction', () => {
    expect(isReadyToClose(makeCase({ healthPersonnel: [personWith] }))).toBe(true);
    expect(isReadyToClose(makeCase({ companies: [companyWith] }))).toBe(true);
    expect(
      isReadyToClose(makeCase({ healthPersonnel: [personWith], companies: [companyWith] })),
    ).toBe(true);
  });

  it('lists every party without a reaction', () => {
    const partly = makeCase({
      healthPersonnel: [personWith, personWithout],
      companies: [companyWith, companyWithout],
    });

    expect(isReadyToClose(partly)).toBe(false);
    expect(missingForClosing(partly)).toEqual({
      noParties: false,
      healthPersonnelWithoutReaction: [personWithout],
      companiesWithoutReaction: [companyWithout],
    });
  });
});
