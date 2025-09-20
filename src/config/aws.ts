import { Amplify } from 'aws-amplify';

// AWS Amplify Configuration
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_WEB_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID || '',
      loginWith: {
        email: true,
        username: false
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: { required: true },
        name: { required: true },
        'custom:campus': { required: true }
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true
      }
    }
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_AWS_S3_BUCKET || '',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      level: 'public' as const
    }
  },
  API: {
    REST: {
      ShareHubAPI: {
        endpoint: import.meta.env.VITE_AWS_API_GATEWAY_URL || '',
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
      }
    }
  }
};

// Amplify configuration is handled conditionally below
//Amplify.configure(awsConfig);

export { awsConfig };

// AWS SDK Configuration for direct access
export const awsSdkConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    // These will be set by Amplify Auth after user login
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: ''
  }
};

// Environment variables
export const env = {
  AWS_REGION: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  AWS_USER_POOL_ID: import.meta.env.VITE_AWS_USER_POOL_ID || '',
  AWS_USER_POOL_WEB_CLIENT_ID: import.meta.env.VITE_AWS_USER_POOL_WEB_CLIENT_ID || '',
  AWS_IDENTITY_POOL_ID: import.meta.env.VITE_AWS_IDENTITY_POOL_ID || '',
  AWS_S3_BUCKET: import.meta.env.VITE_AWS_S3_BUCKET || '',
  AWS_API_GATEWAY_URL: import.meta.env.VITE_AWS_API_GATEWAY_URL || '',
  AWS_SNS_TOPIC_ARN: import.meta.env.VITE_AWS_SNS_TOPIC_ARN || '',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'ShareHub',
  APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development'
};

// Check if we're in development mode
export const isDevelopmentMode = (): boolean => {
  return env.APP_ENVIRONMENT === 'development' || !env.AWS_USER_POOL_ID;
};

// Validate required environment variables
export const validateConfig = (): boolean => {
  if (isDevelopmentMode()) {
    console.log('🚀 Running in development mode - using mock data');
    return true;
  }

  const required = [
    'VITE_AWS_USER_POOL_ID',
    'VITE_AWS_USER_POOL_WEB_CLIENT_ID',
    'VITE_AWS_S3_BUCKET',
    'VITE_AWS_API_GATEWAY_URL'
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
};

// Only configure Amplify if not in development mode
if (!isDevelopmentMode()) {
  Amplify.configure(awsConfig);
}
