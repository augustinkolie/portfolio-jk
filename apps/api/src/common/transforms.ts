import { Transform } from 'class-transformer';

/** « true » / « false » en query string → booléen. */
export const ToBoolean = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    value === 'true' || value === true ? true : value === 'false' || value === false ? false : value,
  );

/** Chaîne vide ou blanche → null : un champ facultatif vidé dans le formulaire efface la valeur. */
export const EmptyToNull = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value,
  );

export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));
