import { describe, expect, it } from 'vitest';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import { reactionsInCase } from './reactions';

describe('reactionsInCase', () => {
  it('lists each reaction given in the case once, in the usual order', () => {
    const supervisionCase = makeCase({
      healthPersonnel: [
        makeHealthPersonnel({
          healthPersonnelNumber: '9000001',
          reaction: 'RestrictionOfPractice',
        }),
        makeHealthPersonnel({ healthPersonnelNumber: '9000002', reaction: 'NoReaction' }),
        makeHealthPersonnel({ healthPersonnelNumber: '9000003' }),
      ],
      companies: [
        makeCompany({ organizationNumber: '900000001', reaction: 'NoReaction' }),
        makeCompany({ organizationNumber: '900000002', reaction: 'SelfAssessment' }),
      ],
    });

    expect(reactionsInCase(supervisionCase)).toEqual([
      'NoReaction',
      'RestrictionOfPractice',
      'SelfAssessment',
    ]);
  });

  it('is empty when no reactions are given', () => {
    expect(reactionsInCase(makeCase())).toEqual([]);
  });
});
