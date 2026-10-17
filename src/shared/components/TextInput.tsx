import { Input, Label, Paragraph, ValidationMessage } from '@digdir/designsystemet-react';
import type { ComponentProps, Ref } from 'react';
import styles from './TextInput.module.css';

interface TextInputProps extends Omit<ComponentProps<typeof Input>, 'id'> {
  id: string;
  label: string;
  description?: string;
  /** Shown below the input and linked to it, so screen readers read it with the field. */
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

// A Designsystemet input with its label, description and error linked by id. Works with
// React Hook Form's register() (React 19 passes `ref` as a normal prop).
// `size` (width in characters) defaults to 30: without it, Designsystemet makes the input fill its box.
export function TextInput({
  id,
  label,
  description,
  error,
  ref,
  size = 30,
  ...inputProps
}: TextInputProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <Paragraph id={descriptionId} data-size="sm">
          {description}
        </Paragraph>
      )}
      <Input
        id={id}
        ref={ref}
        size={size}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error && <ValidationMessage id={errorId}>{error}</ValidationMessage>}
    </div>
  );
}
