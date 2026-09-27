import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import styles from './Field.module.css';

interface FieldFrameProps {
  /** Sert aussi à construire l'id : « champ-<name> ». */
  name: string;
  label: string;
  /** Aide affichée sous le libellé (format attendu, exemple). */
  hint?: string;
  /** Message d'erreur : ce qui ne va pas et comment corriger. */
  error?: string;
  /** Les champs facultatifs sont signalés, les obligatoires sont la norme. */
  optional?: boolean;
}

function ids(name: string) {
  const id = `champ-${name}`;
  return { id, hint: `${id}-aide`, error: `${id}-erreur` };
}

function describedBy(name: string, hint?: string, error?: string): string | undefined {
  const i = ids(name);
  return [hint && i.hint, error && i.error].filter(Boolean).join(' ') || undefined;
}

function FieldFrame({
  name,
  label,
  hint,
  error,
  optional,
  children,
}: FieldFrameProps & { children: ReactNode }) {
  const i = ids(name);
  return (
    <div className={[styles.field, error && styles.hasError].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={i.id}>
        {label}
        {optional && <span className={styles.optional}> (facultatif)</span>}
      </label>
      {hint && (
        <p className={styles.hint} id={i.hint}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className={styles.error} id={i.error}>
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = FieldFrameProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'id' | 'className'>;

export function TextField({ name, label, hint, error, optional, ...input }: TextFieldProps) {
  return (
    <FieldFrame name={name} label={label} hint={hint} error={error} optional={optional}>
      <input
        className={styles.control}
        id={ids(name).id}
        name={name}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        {...input}
      />
    </FieldFrame>
  );
}

type TextAreaProps = FieldFrameProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'id' | 'className'>;

export function TextArea({ name, label, hint, error, optional, rows = 6, ...textarea }: TextAreaProps) {
  return (
    <FieldFrame name={name} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        className={styles.control}
        id={ids(name).id}
        name={name}
        rows={rows}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        {...textarea}
      />
    </FieldFrame>
  );
}

type SelectFieldProps = FieldFrameProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'id' | 'className'> & {
    options: { value: string; label: string }[];
    /** Première option vide (« Choisir… »). */
    placeholder?: string;
  };

export function SelectField({
  name,
  label,
  hint,
  error,
  optional,
  options,
  placeholder,
  ...select
}: SelectFieldProps) {
  return (
    <FieldFrame name={name} label={label} hint={hint} error={error} optional={optional}>
      <div className={styles.selectWrap}>
        <select
          className={styles.control}
          id={ids(name).id}
          name={name}
          required={!optional}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, hint, error)}
          {...select}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </FieldFrame>
  );
}
