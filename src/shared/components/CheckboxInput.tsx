import { Input, Label } from '@digdir/designsystemet-react';
import type { ComponentProps, Ref } from 'react';
import styles from './CheckboxInput.module.css';

interface CheckboxInputProps extends Omit<ComponentProps<typeof Input>, 'id' | 'type'> {
  id: string;
  label: string;
  ref?: Ref<HTMLInputElement>;
}

// A Designsystemet checkbox with its label linked by id (works with React Hook Form's register()).
export function CheckboxInput({ id, label, ref, ...inputProps }: CheckboxInputProps) {
  return (
    <div className={styles.checkbox}>
      <Input id={id} ref={ref} type="checkbox" {...inputProps} />
      <Label htmlFor={id} className={styles.label}>
        {label}
      </Label>
    </div>
  );
}
