import { Alert, Link, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { Link as RouterLink, useParams } from 'react-router';
import { can, useCurrentUser } from '@/features/auth';
import { ApiError } from '@/shared/api/apiRequest';
import { Page } from '@/shared/components/Page';
import { AssignCaseSection } from '../components/AssignCaseSection';
import { ChangeFieldForm } from '../components/ChangeFieldForm';
import { CaseSummary } from '../components/CaseSummary';
import { CompaniesSection } from '../components/CompaniesSection';
import { HealthPersonnelSection } from '../components/HealthPersonnelSection';
import { useCase } from '../hooks/useCase';

// F-002 case detail, read-only for now (editing comes in T2.4-T2.6). Admin gets the restricted
// view from the mock API (F-004), so sensitive data never reaches the browser for Admin.
export function CaseDetailPage() {
  const { id = '' } = useParams();
  const user = useCurrentUser();
  const caseQuery = useCase(id);

  if (caseQuery.isPending) {
    return (
      <Page title="Case details">
        <Spinner aria-label="Loading case" />
      </Page>
    );
  }

  if (caseQuery.isError) {
    const status = caseQuery.error instanceof ApiError ? caseQuery.error.status : undefined;
    return (
      <Page title={status === 404 ? 'Case not found' : 'No access to this case'}>
        <Paragraph>
          {status === 404
            ? 'There is no case with this address.'
            : status === 403
              ? 'You do not have access to this case.'
              : 'The case could not be loaded. Try again.'}
        </Paragraph>
        <Paragraph>
          <Link asChild>
            <RouterLink to="/">Go to the case overview</RouterLink>
          </Link>
        </Paragraph>
      </Page>
    );
  }

  const { data } = caseQuery;
  const canEdit = data.access === 'full' && can(user, 'editCase', data.supervisionCase);
  return (
    <Page title={`Case ${data.supervisionCase.caseNumber}`}>
      <CaseSummary
        supervisionCase={data.supervisionCase}
        assignedCaseWorker={data.assignedCaseWorker}
      />
      {data.access === 'full' ? (
        <>
          {can(user, 'assignCase', data.supervisionCase) && (
            // A fresh form per case and per user (mock switcher), so an old choice is never kept.
            <AssignCaseSection
              key={`assign-${data.supervisionCase.id}-${user.id}`}
              supervisionCase={data.supervisionCase}
            />
          )}
          {canEdit && (
            <ChangeFieldForm
              key={`field-${data.supervisionCase.id}-${user.id}`}
              supervisionCase={data.supervisionCase}
              user={user}
            />
          )}
          <HealthPersonnelSection
            key={`health-personnel-${data.supervisionCase.id}-${user.id}`}
            caseId={data.supervisionCase.id}
            healthPersonnel={data.supervisionCase.healthPersonnel}
            editable={canEdit}
          />
          <CompaniesSection
            key={`companies-${data.supervisionCase.id}-${user.id}`}
            caseId={data.supervisionCase.id}
            companies={data.supervisionCase.companies}
            editable={canEdit}
          />
        </>
      ) : (
        <Alert data-color="info">
          As an admin you see this case without its sensitive data: health personnel and companies
          are hidden.
        </Alert>
      )}
    </Page>
  );
}
