import { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';

export type JBFieldControlProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = {
  control: Control<TFieldValues>;
  name: TName;
  rules?: RegisterOptions<TFieldValues, TName>;
};

export type SelectOption<TValue = string> = {
  label: string;
  value: TValue;
  disabled?: boolean;
};
