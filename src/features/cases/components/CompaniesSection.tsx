import { Button, Card, Heading, Paragraph } from '@digdir/designsystemet-react';
import { useState } from 'react';
import { COMPANY_REACTION_LABELS } from '../labels';
import type { Company } from '../types';
import { AddCompanyForm } from './AddCompanyForm';
import { CompanyReactionForm } from './PartyReactionForms';
import styles from './CaseDetail.module.css';
import { RemoveCompanyButton } from './RemoveCompanyButton';

interface CompaniesSectionProps {
  caseId: string;
  companies: Company[];
  /** The assigned case worker may add and remove companies (F-002). */
  editable: boolean;
}

export function CompaniesSection({ caseId, companies, editable }: CompaniesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  return (
    <section className={styles.section} aria-labelledby="companies-heading">
      <Heading id="companies-heading" level={2} data-size="sm">
        Companies
      </Heading>
      {companies.length === 0 ? (
        <Paragraph>No companies added yet.</Paragraph>
      ) : (
        <ul className={styles.parties}>
          {companies.map((company) => (
            <li key={company.id}>
              <Card data-color="neutral" className={styles.party}>
                <Heading level={3} data-size="xs">
                  {company.name}
                </Heading>
                <Paragraph>Organization number: {company.organizationNumber}</Paragraph>
                {company.description && <Paragraph>{company.description}</Paragraph>}
                <Paragraph>
                  Address: {company.address.streetName}, {company.address.zipCode},{' '}
                  {company.address.state}, {company.address.country}
                </Paragraph>
                {editable ? (
                  <CompanyReactionForm caseId={caseId} company={company} />
                ) : (
                  <Paragraph>
                    Reaction:{' '}
                    {company.reaction
                      ? COMPANY_REACTION_LABELS[company.reaction]
                      : 'No reaction given yet'}
                  </Paragraph>
                )}
                {editable && (
                  <RemoveCompanyButton
                    caseId={caseId}
                    company={company}
                    onRemoved={(removed) => setStatusMessage(`${removed.name} was removed.`)}
                  />
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editable &&
        (isAdding ? (
          <AddCompanyForm
            caseId={caseId}
            onAdded={(added) => {
              setIsAdding(false);
              setStatusMessage(`${added.name} was added.`);
            }}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                setStatusMessage('');
                setIsAdding(true);
              }}
            >
              Add company
            </Button>
          </div>
        ))}
      {editable && <Paragraph role="status">{statusMessage}</Paragraph>}
    </section>
  );
}
