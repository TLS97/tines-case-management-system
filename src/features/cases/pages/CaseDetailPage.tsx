import { Alert, Link, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { Link as RouterLink, useParams } from 'react-router';
import { ApiError } from '@/shared/api/apiRequest';
import { Page } from '@/shared/components/Page';
import { CaseSummary } from '../components/CaseSummary';
import { CompaniesSection } from '../components/CompaniesSection';
import { HealthPersonnelSection } from '../components/HealthPersonnelSection';
import { useCase } from '../hooks/useCase';

// F-002 case detail, read-only for now (editing comes in T2.4-T2.6). Admin gets the restricted
// view from the mock API (F-004), so sensitive data never reaches the browser for Admin.
export function CaseDetailPage() {
  const { id = '' } = useParams();
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
  return (
    <Page title={`Case ${data.supervisionCase.caseNumber}`}>
      <CaseSummary
        supervisionCase={data.supervisionCase}
        assignedCaseWorker={data.assignedCaseWorker}
      />
      {data.access === 'full' ? (
        <>
          <HealthPersonnelSection healthPersonnel={data.supervisionCase.healthPersonnel} />
          <CompaniesSection companies={data.supervisionCase.companies} />
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
