export const objectToQueryString = (obj: Record<string, unknown>): string =>
  Object.keys(obj)
    .filter((key) => obj[key] !== undefined && obj[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(obj[key]))}`)
    .join('&');

