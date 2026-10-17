import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Heading,
  Label,
  Paragraph,
  Select,
  Spinner,
  ValidationMessage,
} from '@digdir/designsystemet-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FIELD_LABELS } from '@/features/auth';
import { ApiError } from '@/shared/api/apiRequest';
import type { CaseWorkerSummary } from '../caseResponse';
import { useAssignCase, useEligibleCaseWorkers } from '../hooks/useAssignCase';
import type { SupervisionCase } from '../types';
import styles from './CaseDetail.module.css';

const SELECT_ID = 'assign-case-worker';
const ERROR_ID = 'assign-case-worker-error';

const formSchema = z.object({
  caseWorkerId: z.string().min(1, 'Choose a case worker'),
});

interface AssignCaseSectionProps {
  supervisionCase: SupervisionCase;
}

// F-004: the leader assigns an Unassigned case, or reassigns it to another case worker.
// Only rendered when can(user, 'assignCase', case).
export function AssignCaseSection({ supervisionCase }: AssignCaseSectionProps) {
  const eligible = useEligibleCaseWorkers(supervisionCase.id);
  const assign = useAssignCase(supervisionCase.id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(formSchema), defaultValues: { caseWorkerId: '' } });

  const isReassign = supervisionCase.assignedTo !== null;
  const heading = isReassign ? 'Reassign case' : 'Assign case';
  const candidates = (eligible.data ?? []).filter(
    (caseWorker) => caseWorker.id !== supervisionCase.assignedTo,
  );

  const onSubmit = handleSubmit(({ caseWorkerId }) => {
    assign.mutate(caseWorkerId, { onSuccess: () => reset() });
  });

  return (
    <section className={styles.section} aria-labelledby="assign-case-heading">
      <Heading id="assign-case-heading" level={2} data-size="sm">
        {heading}
      </Heading>
      {eligible.isPending ? (
        <Spinner aria-label="Loading case workers" />
      ) : eligible.isError ? (
        <Paragraph>The case workers could not be loaded. Try again.</Paragraph>
      ) : candidates.length === 0 ? (
        <Paragraph>
          There are no {isReassign ? 'other ' : ''}active case workers in your department with
          access to the field {FIELD_LABELS[supervisionCase.field]}.
        </Paragraph>
      ) : (
        <form className={styles.inlineForm} onSubmit={(event) => void onSubmit(event)} noValidate>
          <div className={styles.formField}>
            <Label htmlFor={SELECT_ID}>Case worker</Label>
            <Select
              id={SELECT_ID}
              width="auto"
              aria-invalid={errors.caseWorkerId ? true : undefined}
              aria-describedby={errors.caseWorkerId ? ERROR_ID : undefined}
              {...register('caseWorkerId')}
            >
              <option value="">Choose a case worker</option>
              {candidates.map((caseWorker) => (
                <option key={caseWorker.id} value={caseWorker.id}>
                  {fullName(caseWorker)}
                </option>
              ))}
            </Select>
            {errors.caseWorkerId && (
              <ValidationMessage id={ERROR_ID}>{errors.caseWorkerId.message}</ValidationMessage>
            )}
          </div>
          <Button type="submit" loading={assign.isPending}>
            {isReassign ? 'Reassign' : 'Assign'}
          </Button>
        </form>
      )}

      <Paragraph role="status">
        {assign.isSuccess && assign.data.assignedCaseWorker
          ? `The case is assigned to ${fullName(assign.data.assignedCaseWorker)}.`
          : ''}
      </Paragraph>
      {assign.isError && (
        <Alert data-color="danger">
          {assign.error instanceof ApiError && assign.error.status === 403
            ? 'You are not allowed to assign this case.'
            : 'The case could not be assigned. Try again.'}
        </Alert>
      )}
    </section>
  );
}

function fullName(caseWorker: CaseWorkerSummary): string {
  return `${caseWorker.firstName} ${caseWorker.surname}`;
}
