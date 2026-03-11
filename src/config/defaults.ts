import { JBAppConfig } from './types';

export const defaultJBAppConfig: JBAppConfig = {
  debug: false,
  forceHideStage: false,
  stage: 'DEVELOPMENT',
  defaultRows: 30,
  maxRows: 999999999,
  momentLocale: 'es-mx',
  defaultLocaleDate: 'es',
  dateFormat: 'YYYY-MM-DD',
  dateTimeFormat: 'dddd DD MMM YYYY HH:mm:ss',
  defaultFormatDateAPI: 'YYYY-MM-DD',
  api: {
    version: 'v1',
    host: {
      PRODUCTION: 'https://api.example.com',
      QA: 'https://api-qa.example.com',
      DEVELOPMENT: 'http://127.0.0.1:8000',
      LOCAL: 'http://localhost:8000'
    }
  },
  auth: {
    apiBasePath: '/authentication',
    showDebugSocial: false,
    enableOtpAuth: true,
    profileRoles: [],
    defaultProfileRole: undefined,
    account: {
      allowProfileManagement: false,
      enableContactVerification: true,
      allowDeleteAccount: false,
      allowAccountEdit: true,
      allowDefaultProfileEdit: true,
      allowProfilePictureChange: true,
      ensureProfileCompletion: false,
      profileCompletionPath: '/account/complete-profile',
      requiredProfileFields: {
        firstName: true,
        lastName1: true,
        lastName2: false,
        birthday: true,
        gender: true,
        label: false
      },
      subscriptionUrl: undefined
    },
    social: {
      google: {
        enabled: false
      },
      facebook: {
        enabled: false
      },
      apple: {
        enabled: false
      }
    }
  },
  integrations: {
  }
};
