import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Field } from '@/features/auth';
import {
  addCompany,
  addHealthPersonnel,
  caseQuery,
  changeCaseField,
  removeCompany,
  removeHealthPersonnel,
  setCompanyReaction,
  setHealthPersonnelReaction,
} from '../api';
import type { CaseResponse } from '../caseResponse';
import type {
  CompanyReaction,
  HealthPersonnelReaction,
  NewCompany,
  NewHealthPersonnel,
} from '../types';

// F-002 edits. Each updates the page from the mock API's response instead of refetching the case,
// since every fetch of a case is logged as "case opened" (F-005).

function useCaseMutation<TInput>(
  caseId: string,
  mutationFn: (input: TInput) => Promise<CaseResponse>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(caseQuery(caseId).queryKey, response);
    },
  });
}

export function useChangeCaseField(caseId: string) {
  return useCaseMutation(caseId, (field: Field) => changeCaseField(caseId, field));
}

export function useAddHealthPersonnel(caseId: string) {
  return useCaseMutation(caseId, (person: NewHealthPersonnel) =>
    addHealthPersonnel(caseId, person),
  );
}

export function useRemoveHealthPersonnel(caseId: string) {
  return useCaseMutation(caseId, (personId: string) => removeHealthPersonnel(caseId, personId));
}

export function useAddCompany(caseId: string) {
  return useCaseMutation(caseId, (company: NewCompany) => addCompany(caseId, company));
}

export function useRemoveCompany(caseId: string) {
  return useCaseMutation(caseId, (companyId: string) => removeCompany(caseId, companyId));
}

export function useSetHealthPersonnelReaction(caseId: string, personId: string) {
  return useCaseMutation(caseId, (reaction: HealthPersonnelReaction) =>
    setHealthPersonnelReaction(caseId, personId, reaction),
  );
}

export function useSetCompanyReaction(caseId: string, companyId: string) {
  return useCaseMutation(caseId, (reaction: CompanyReaction) =>
    setCompanyReaction(caseId, companyId, reaction),
  );
}
