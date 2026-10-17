import { Card, Heading, Paragraph } from '@digdir/designsystemet-react';
import { COMPANY_REACTION_LABELS } from '../labels';
import type { Company } from '../types';
import styles from './CaseDetail.module.css';

interface CompaniesSectionProps {
  companies: Company[];
}

export function CompaniesSection({ companies }: CompaniesSectionProps) {
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
            // Organization numbers are unique within a case.
            <li key={company.organizationNumber}>
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
                <Paragraph>
                  Reaction:{' '}
                  {company.reaction
                    ? COMPANY_REACTION_LABELS[company.reaction]
                    : 'No reaction given yet'}
                </Paragraph>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
