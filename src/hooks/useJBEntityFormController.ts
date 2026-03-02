import { useEffect, useRef, useState } from 'react';
import { FieldValues, UseFormReset } from 'react-hook-form';

type JBEntityFormRetrieveQuery<TRetrieveData> = {
  data?: TRetrieveData | null;
  isError: boolean;
  error?: unknown;
};

type UseJBEntityFormControllerMessages = {
  loadError?: string;
  saveError?: string;
  deleteError?: string;
  createSuccess?: string;
  updateSuccess?: string;
  deleteSuccess?: string;
};

type UseJBEntityFormControllerOptions<TFormValues extends FieldValues, TRetrieveData, TCreateResponse> = {
  isNew: boolean;
  itemId?: string;
  defaultValues: TFormValues;
  retrieveQuery: JBEntityFormRetrieveQuery<TRetrieveData>;
  reset: UseFormReset<TFormValues>;
  mapRetrieveToValues: (data: TRetrieveData) => TFormValues;
  createItem: (formData: TFormValues) => Promise<TCreateResponse>;
  updateItem: (id: string, formData: TFormValues) => Promise<unknown>;
  deleteItem: (id: string) => Promise<unknown>;
  navigateToList: () => void;
  navigateToEdit: (id: string | number) => void;
  onShowError: (error: unknown, fallbackMessage: string) => void;
  onShowSuccess?: (message: string) => void;
  getCreatedId?: (response: TCreateResponse) => string | number | undefined;
  messages?: UseJBEntityFormControllerMessages;
};

type UseJBEntityFormControllerResult<TFormValues extends FieldValues> = {
  formDisabled: boolean;
  loadedValues: TFormValues;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  handleStartEdit: () => void;
  handleCancelEdit: () => void;
  handleSave: (formData: TFormValues) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleSubmitOnEnter: (
    event: {
      key: string;
      defaultPrevented?: boolean;
      altKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      shiftKey?: boolean;
      target: EventTarget | null;
      preventDefault: () => void;
    },
    submit: () => void
  ) => void;
};

const DEFAULT_MESSAGES: Required<UseJBEntityFormControllerMessages> = {
  loadError: 'No se pudo cargar el registro.',
  saveError: 'No se pudo guardar el registro.',
  deleteError: 'No se pudo eliminar el registro.',
  createSuccess: 'Registro creado correctamente.',
  updateSuccess: 'Registro actualizado correctamente.',
  deleteSuccess: 'Registro eliminado correctamente.'
};

export function useJBEntityFormController<TFormValues extends FieldValues, TRetrieveData, TCreateResponse>(
  options: UseJBEntityFormControllerOptions<TFormValues, TRetrieveData, TCreateResponse>
): UseJBEntityFormControllerResult<TFormValues> {
  const {
    isNew,
    itemId,
    defaultValues,
    retrieveQuery,
    reset,
    mapRetrieveToValues,
    createItem,
    updateItem,
    deleteItem,
    navigateToList,
    navigateToEdit,
    onShowError,
    onShowSuccess,
    getCreatedId,
    messages
  } = options;

  const mapRetrieveToValuesRef = useRef(mapRetrieveToValues);
  const onShowErrorRef = useRef(onShowError);
  const navigateToListRef = useRef(navigateToList);

  useEffect(() => {
    mapRetrieveToValuesRef.current = mapRetrieveToValues;
  }, [mapRetrieveToValues]);

  useEffect(() => {
    onShowErrorRef.current = onShowError;
  }, [onShowError]);

  useEffect(() => {
    navigateToListRef.current = navigateToList;
  }, [navigateToList]);

  const resolvedMessages: Required<UseJBEntityFormControllerMessages> = {
    ...DEFAULT_MESSAGES,
    ...messages
  };

  const [formDisabled, setFormDisabled] = useState(!isNew);
  const [loadedValues, setLoadedValues] = useState<TFormValues>(defaultValues);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const skipRetrieveErrorAfterDeleteRef = useRef(false);

  useEffect(() => {
    if (isNew) {
      reset(defaultValues);
      setLoadedValues(defaultValues);
      setFormDisabled(false);
      return;
    }

    if (retrieveQuery.isError) {
      if (skipRetrieveErrorAfterDeleteRef.current) {
        return;
      }
      onShowErrorRef.current(retrieveQuery.error, resolvedMessages.loadError);
      navigateToListRef.current();
      return;
    }

    if (!retrieveQuery.data) {
      return;
    }

    const values = mapRetrieveToValuesRef.current(retrieveQuery.data);
    setLoadedValues(values);
    reset(values);
    setFormDisabled(true);
  }, [
    defaultValues,
    isNew,
    reset,
    resolvedMessages.loadError,
    retrieveQuery.data,
    retrieveQuery.error,
    retrieveQuery.isError
  ]);

  const handleSave = async (formData: TFormValues) => {
    try {
      if (isNew) {
        const response = await createItem(formData);
        onShowSuccess?.(resolvedMessages.createSuccess);

        const createdId =
          getCreatedId?.(response) ?? (response as { data?: { id?: string | number } })?.data?.id;

        if (createdId !== undefined && createdId !== null) {
          navigateToEdit(createdId);
        }
        return;
      }

      if (!itemId) {
        return;
      }

      await updateItem(itemId, formData);
      setLoadedValues(formData);
      setFormDisabled(true);
      onShowSuccess?.(resolvedMessages.updateSuccess);
    } catch (error) {
      onShowError(error, resolvedMessages.saveError);
    }
  };

  const handleDelete = async () => {
    if (!itemId) {
      return;
    }

    try {
      skipRetrieveErrorAfterDeleteRef.current = true;
      await deleteItem(itemId);
      setDeleteDialogOpen(false);
      onShowSuccess?.(resolvedMessages.deleteSuccess);
      navigateToList();
    } catch (error) {
      skipRetrieveErrorAfterDeleteRef.current = false;
      onShowError(error, resolvedMessages.deleteError);
    }
  };

  const handleStartEdit = () => {
    setFormDisabled(false);
  };

  const handleCancelEdit = () => {
    if (isNew) {
      return;
    }

    reset(loadedValues);
    setFormDisabled(true);
  };

  const handleSubmitOnEnter: UseJBEntityFormControllerResult<TFormValues>['handleSubmitOnEnter'] = (
    event,
    submit
  ) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.defaultPrevented) {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    if (formDisabled || deleteDialogOpen) {
      return;
    }

    const targetElement = event.target;
    if (targetElement instanceof HTMLElement) {
      const tagName = targetElement.tagName.toLowerCase();
      const inputType = targetElement.getAttribute('type')?.toLowerCase();
      const role = targetElement.getAttribute('role')?.toLowerCase();
      const ariaAutocomplete = targetElement.getAttribute('aria-autocomplete')?.toLowerCase();

      if (
        tagName === 'textarea' ||
        tagName === 'button' ||
        role === 'button' ||
        role === 'combobox' ||
        ariaAutocomplete === 'list' ||
        targetElement.isContentEditable ||
        inputType === 'submit' ||
        inputType === 'button'
      ) {
        return;
      }
    }

    event.preventDefault();
    submit();
  };

  return {
    formDisabled,
    loadedValues,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleStartEdit,
    handleCancelEdit,
    handleSave,
    handleDelete,
    handleSubmitOnEnter
  };
}
