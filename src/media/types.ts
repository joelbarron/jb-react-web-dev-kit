import { Area } from 'react-easy-crop';

export type JBImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';
export type JBImageCropOutputType = 'data_url' | 'blob';

export type JBFileValidationOptions = {
  maxBytes?: number;
  acceptedMimeTypes?: string[];
};

export type JBImageCropConfig = {
  aspect?: number;
  allowFreeAspect?: boolean;
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  mimeType?: JBImageMimeType;
  outputType?: JBImageCropOutputType;
  minZoom?: number;
  maxZoom?: number;
  title?: string;
  helperText?: string;
};

export type JBImageCropSelectOptions = JBImageCropConfig & {
  validation?: JBFileValidationOptions;
};

export type JBImageCropResult = {
  value: string | Blob;
  dataUrl: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
  originalFile: File;
};

export type JBImageCropDialogProps = {
  open: boolean;
  imageSrc: string;
  config: JBImageCropConfig;
  processing?: boolean;
  onCancel: () => void;
  onConfirm: (croppedAreaPixels: Area) => void;
};

