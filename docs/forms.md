# Forms

Campos shared para `react-hook-form` + MUI.

## Campos disponibles

- `JBTextField`
- `JBSelectField`
- `JBCheckboxField`
- `JBSwitchField`
- `JBRadioGroupField`
- `JBDatePickerField`
- `JBTimePickerField`

## Reglas reutilizables

`jbRules` exporta helpers:

- `required`
- `email`
- `minLength`
- `maxLength`
- `pattern`
- `compose`

Puedes usar `rules` junto con `zodResolver`. Si validas lo mismo en ambos lados, se mostrara el error que llegue primero al campo.

## Ejemplo

```tsx
import { useForm } from 'react-hook-form';
import { JBTextField, JBSelectField, JBCheckboxField, jbRules } from '@joelbarron/react-web-dev-kit/forms';

type FormValues = {
  name: string;
  status: string;
  acceptTerms: boolean;
};

const statusOptions = [
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'Inactivo', value: 'INACTIVE' }
];

function ExampleForm() {
  const { control } = useForm<FormValues>({
    defaultValues: {
      name: '',
      status: '',
      acceptTerms: false
    }
  });

  return (
    <>
      <JBTextField
        control={control}
        name="name"
        label="Nombre"
        rules={jbRules.required('Ingresa el nombre')}
      />
      <JBSelectField
        control={control}
        name="status"
        label="Estatus"
        options={statusOptions}
      />
      <JBCheckboxField
        control={control}
        name="acceptTerms"
        label="Acepto terminos"
      />
    </>
  );
}
```
