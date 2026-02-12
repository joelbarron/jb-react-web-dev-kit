import { DependencyList, useEffect } from 'react';

export type UseJBRedirectOptions = {
  enabled?: boolean;
  shouldRedirect: () => boolean;
  getTargetPath: () => string;
  navigate: (path: string) => void;
  deps?: DependencyList;
};

export const useJBRedirect = (options: UseJBRedirectOptions): void => {
  const {
    enabled = true,
    shouldRedirect,
    getTargetPath,
    navigate,
    deps = []
  } = options;

  useEffect(() => {
    if (!enabled) return;
    if (!shouldRedirect()) return;
    navigate(getTargetPath());
  }, [enabled, getTargetPath, navigate, shouldRedirect, ...deps]);
};

