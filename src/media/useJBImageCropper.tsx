import { Area } from 'react-easy-crop';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { JBImageCropDialog } from './JBImageCropDialog';
import { processCroppedImage, readFileAsDataUrl, validateFileAgainstRules } from './imageUtils';
import { JBImageCropConfig, JBImageCropResult, JBImageCropSelectOptions } from './types';

type PendingCropState = {
  file: File;
  imageSrc: string;
  config: JBImageCropConfig;
};

type PendingPromiseHandlers = {
  resolve: (value: JBImageCropResult | null) => void;
  reject: (error: Error) => void;
};

const mergeCropConfig = (
  baseConfig?: Partial<JBImageCropConfig>,
  overrides?: Partial<JBImageCropConfig>
): JBImageCropConfig => {
  return {
    ...(baseConfig || {}),
    ...(overrides || {})
  };
};

export const useJBImageCropper = (defaultConfig?: Partial<JBImageCropConfig>) => {
  const [pendingCrop, setPendingCrop] = useState<PendingCropState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingPromiseRef = useRef<PendingPromiseHandlers | null>(null);

  const clearPendingPromise = useCallback(() => {
    pendingPromiseRef.current = null;
  }, []);

  const closeDialog = useCallback(() => {
    setPendingCrop(null);
    setIsProcessing(false);
  }, []);

  const resolveAndClose = useCallback(
    (value: JBImageCropResult | null) => {
      const handlers = pendingPromiseRef.current;
      clearPendingPromise();
      closeDialog();
      handlers?.resolve(value);
    },
    [clearPendingPromise, closeDialog]
  );

  const rejectAndClose = useCallback(
    (error: Error) => {
      const handlers = pendingPromiseRef.current;
      clearPendingPromise();
      closeDialog();
      handlers?.reject(error);
    },
    [clearPendingPromise, closeDialog]
  );

  const selectImageFile = useCallback(
    async (file: File, options?: JBImageCropSelectOptions): Promise<JBImageCropResult | null> => {
      if (pendingPromiseRef.current) {
        pendingPromiseRef.current.resolve(null);
        clearPendingPromise();
      }

      const validationError = validateFileAgainstRules(file, options?.validation);
      if (validationError) {
        throw new Error(validationError);
      }

      if (!String(file.type || '').toLowerCase().startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen para este campo.');
      }

      const imageSrc = await readFileAsDataUrl(file);
      const mergedConfig = mergeCropConfig(defaultConfig, options);

      setPendingCrop({
        file,
        imageSrc,
        config: mergedConfig
      });

      return new Promise<JBImageCropResult | null>((resolve, reject) => {
        pendingPromiseRef.current = {
          resolve,
          reject
        };
      });
    },
    [clearPendingPromise, defaultConfig]
  );

  const handleCancel = useCallback(() => {
    resolveAndClose(null);
  }, [resolveAndClose]);

  const handleConfirm = useCallback(
    async (croppedAreaPixels: Area) => {
      if (!pendingCrop) {
        return;
      }

      try {
        setIsProcessing(true);
        const result = await processCroppedImage({
          file: pendingCrop.file,
          imageSrc: pendingCrop.imageSrc,
          croppedAreaPixels,
          config: pendingCrop.config
        });
        resolveAndClose(result);
      } catch (error) {
        rejectAndClose(
          error instanceof Error
            ? error
            : new Error('No se pudo procesar la imagen seleccionada.')
        );
      }
    },
    [pendingCrop, rejectAndClose, resolveAndClose]
  );

  useEffect(() => {
    return () => {
      if (pendingPromiseRef.current) {
        pendingPromiseRef.current.resolve(null);
        clearPendingPromise();
      }
    };
  }, [clearPendingPromise]);

  const cropDialog = useMemo(
    () => (
      <JBImageCropDialog
        open={Boolean(pendingCrop)}
        imageSrc={pendingCrop?.imageSrc || ''}
        config={pendingCrop?.config || {}}
        processing={isProcessing}
        onCancel={handleCancel}
        onConfirm={(areaPixels) => {
          void handleConfirm(areaPixels);
        }}
      />
    ),
    [handleCancel, handleConfirm, isProcessing, pendingCrop]
  );

  return {
    selectImageFile,
    cropDialog,
    isCropDialogOpen: Boolean(pendingCrop)
  };
};

