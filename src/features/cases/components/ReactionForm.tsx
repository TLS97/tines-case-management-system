import { Alert, Button, Label, Paragraph, Select } from '@digdir/designsystemet-react';
import { useId, useState } from 'react';
import styles from './CaseDetail.module.css';

interface ReactionFormProps<R extends string> {
  /** Who the reaction is for, so each selector has its own accessible name. */
  partyName: string;
  current: R | undefined;
  /** Only the reactions allowed for this kind of party (F-002), in order. */
  choices: readonly R[];
  labels: Record<R, string>;
  isPending: boolean;
  savedMessage?: string;
  errorMessage?: string;
  onSave: (reaction: R) => void;
}

// F-002: the assigned case worker gives a health personnel or company one reaction.
export function ReactionForm<R extends string>({
  partyName,
  current,
  choices,
  labels,
  isPending,
  savedMessage,
  errorMessage,
  onSave,
}: ReactionFormProps<R>) {
  const selectId = useId();
  const [selected, setSelected] = useState<string>(current ?? '');
  const chosen = choices.find((choice) => choice === selected);

  return (
    <div className={styles.formField}>
      <form
        className={styles.inlineForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (chosen) onSave(chosen);
        }}
      >
        <div className={styles.formField}>
          <Label htmlFor={selectId}>Reaction for {partyName}</Label>
          <Select
            id={selectId}
            width="auto"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {current === undefined && <option value="">Choose a reaction</option>}
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                {labels[choice]}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={!chosen || chosen === current}
          loading={isPending}
        >
          Save reaction
        </Button>
      </form>
      <Paragraph role="status">{savedMessage ?? ''}</Paragraph>
      {errorMessage && <Alert data-color="danger">{errorMessage}</Alert>}
    </div>
  );
}
