import { ComponentType, ReactNode } from 'react';

export type AuthLinkComponentProps = {
  to: string;
  className?: string;
  children?: ReactNode;
};

export type AuthLinkComponent = ComponentType<AuthLinkComponentProps>;

export type AuthPageLayoutVariant = 'split' | 'fullScreen' | 'modern';

export type AuthMessageSectionProps = {
  titleLines?: string[];
  description?: string;
  footerText?: string;
  avatarUrls?: string[];
};
