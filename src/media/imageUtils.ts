import { Area } from 'react-easy-crop';

import { JBFileValidationOptions, JBImageCropConfig, JBImageCropResult, JBImageMimeType } from './types';

const MIME_TYPE_TO_EXTENSION: Record<JBImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo procesar la imagen seleccionada.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });

const blobToDataUrl = async (blob: Blob): Promise<string> => {
  return readFileAsDataUrl(new File([blob], 'image'));
};

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada.'));
    image.src = src;
  });

const sanitizeCroppedArea = (area: Area): Area => {
  return {
    x: Math.max(0, Math.floor(area.x)),
    y: Math.max(0, Math.floor(area.y)),
    width: Math.max(1, Math.floor(area.width)),
    height: Math.max(1, Math.floor(area.height))
  };
};

const resolveTargetSize = (area: Area, config: JBImageCropConfig): { width: number; height: number } => {
  const sanitizedArea = sanitizeCroppedArea(area);
  const targetWidth = Number(config.targetWidth || 0);
  const targetHeight = Number(config.targetHeight || 0);

  if (targetWidth > 0 && targetHeight > 0) {
    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight)
    };
  }

  if (targetWidth > 0) {
    const ratio = sanitizedArea.height / sanitizedArea.width;
    return {
      width: Math.round(targetWidth),
      height: Math.max(1, Math.round(targetWidth * ratio))
    };
  }

  if (targetHeight > 0) {
    const ratio = sanitizedArea.width / sanitizedArea.height;
    return {
      width: Math.max(1, Math.round(targetHeight * ratio)),
      height: Math.round(targetHeight)
    };
  }

  return {
    width: sanitizedArea.width,
    height: sanitizedArea.height
  };
};

const resolveOutputFileName = (originalFileName: string, mimeType: string): string => {
  const baseName = String(originalFileName || '')
    .trim()
    .replace(/\.[^/.]+$/g, '') || 'image';

  const extension = MIME_TYPE_TO_EXTENSION[mimeType as JBImageMimeType] || 'jpg';
  return `${baseName}.${extension}`;
};

const normalizeMimeType = (mimeType?: string): JBImageMimeType => {
  if (mimeType === 'image/png' || mimeType === 'image/webp') {
    return mimeType;
  }
  return 'image/jpeg';
};

export const validateFileAgainstRules = (file: File, validation?: JBFileValidationOptions): string | null => {
  if (!validation) {
    return null;
  }

  if (validation.maxBytes && file.size > validation.maxBytes) {
    return `El archivo excede el tamaño máximo permitido (${Math.round(validation.maxBytes / (1024 * 1024))} MB).`;
  }

  const acceptedMimeTypes = validation.acceptedMimeTypes || [];
  if (!acceptedMimeTypes.length) {
    return null;
  }

  const normalizedFileType = String(file.type || '').toLowerCase();
  const matches = acceptedMimeTypes.some((acceptedType) => {
    const normalizedAcceptedType = String(acceptedType || '')
      .trim()
      .toLowerCase();

    if (!normalizedAcceptedType) {
      return false;
    }

    if (normalizedAcceptedType.endsWith('/*')) {
      const prefix = normalizedAcceptedType.slice(0, normalizedAcceptedType.length - 1);
      return normalizedFileType.startsWith(prefix);
    }

    return normalizedFileType === normalizedAcceptedType;
  });

  if (!matches) {
    return 'El tipo de archivo seleccionado no está permitido.';
  }

  return null;
};

export const processCroppedImage = async (params: {
  file: File;
  imageSrc: string;
  croppedAreaPixels: Area;
  config: JBImageCropConfig;
}): Promise<JBImageCropResult> => {
  const image = await loadImageElement(params.imageSrc);
  const croppedArea = sanitizeCroppedArea(params.croppedAreaPixels);
  const outputSize = resolveTargetSize(croppedArea, params.config);
  const mimeType = normalizeMimeType(params.config.mimeType);
  const quality = clampNumber(Number(params.config.quality ?? 0.85), 0.1, 1);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo inicializar el procesamiento de imagen.');
  }

  context.drawImage(
    image,
    croppedArea.x,
    croppedArea.y,
    croppedArea.width,
    croppedArea.height,
    0,
    0,
    outputSize.width,
    outputSize.height
  );

  const blob = await canvasToBlob(canvas, mimeType, quality);
  const dataUrl = await blobToDataUrl(blob);
  const outputType = params.config.outputType ?? 'data_url';

  return {
    value: outputType === 'blob' ? blob : dataUrl,
    dataUrl,
    blob,
    fileName: resolveOutputFileName(params.file.name, mimeType),
    mimeType,
    size: blob.size,
    originalFile: params.file
  };
};

