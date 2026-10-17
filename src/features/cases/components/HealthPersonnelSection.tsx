import {
  Card,
  Heading,
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@digdir/designsystemet-react';
import { formatDate } from '@/shared/utils/formatDate';
import { HEALTH_PERSONNEL_REACTION_LABELS } from '../labels';
import type { HealthPersonnel } from '../types';
import styles from './CaseDetail.module.css';

interface HealthPersonnelSectionProps {
  healthPersonnel: HealthPersonnel[];
}

export function HealthPersonnelSection({ healthPersonnel }: HealthPersonnelSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="health-personnel-heading">
      <Heading id="health-personnel-heading" level={2} data-size="sm">
        Health personnel
      </Heading>
      {healthPersonnel.length === 0 ? (
        <Paragraph>No health personnel added yet.</Paragraph>
      ) : (
        <ul className={styles.parties}>
          {healthPersonnel.map((person) => (
            <li key={person.id}>
              <Card data-color="neutral" className={styles.party}>
                <Heading level={3} data-size="xs">
                  {person.firstName} {person.surname}
                </Heading>
                <Paragraph>Health personnel number: {person.healthPersonnelNumber}</Paragraph>
                <Table>
                  <caption>
                    Authorizations for {person.firstName} {person.surname}
                  </caption>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Description</TableHeaderCell>
                      <TableHeaderCell>Valid from</TableHeaderCell>
                      <TableHeaderCell>Valid to</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {person.authorizations.map((authorization, index) => (
                      // Authorizations have no id; their order within a person is stable.
                      <TableRow key={index}>
                        <TableCell>{authorization.description || '–'}</TableCell>
                        <TableCell>{formatDate(authorization.validFromDate)}</TableCell>
                        <TableCell>
                          {authorization.validToDate ? formatDate(authorization.validToDate) : '–'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Paragraph>
                  Reaction:{' '}
                  {person.reaction
                    ? HEALTH_PERSONNEL_REACTION_LABELS[person.reaction]
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
