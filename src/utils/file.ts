export const getFileExtension = (fileName: string): string => {
  const normalizedName = String(fileName || '')
    .trim()
    .toLowerCase();
  const lastDotIndex = normalizedName.lastIndexOf('.');

  if (lastDotIndex < 0) {
    return '';
  }

  return normalizedName.slice(lastDotIndex);
};

export const toMbLabel = (bytes: number): string =>
  `${Math.round(bytes / (1024 * 1024))} MB`;
