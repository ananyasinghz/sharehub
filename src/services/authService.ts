import { 
  signIn, 
  signUp, 
  confirmSignUp, 
  signOut, 
  getCurrentUser,
  fetchAuthSession,
  type SignInInput,
  type SignUpInput
} from '@aws-amplify/auth';
import { User } from '../types';
import { isDevelopmentMode } from '../config/aws';

export interface AuthResponse {
  user: User;
  isNewUser?: boolean;
}

export interface SignUpResponse {
  isSignUpComplete: boolean;
  userId?: string;
  nextStep: {
    signUpStep: string;
    additionalInfo?: any;
  };
}

class AuthService {
  /**
   * Sign in with email and password
   */
  async login(email: string, password: string): Promise<User> {
    // Development mode: use mock authentication
    if (isDevelopmentMode()) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Mock user data
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: email,
        campus: 'Main Campus',
        joinedAt: '2024-01-15T10:00:00Z',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('John Doe')}&background=10b981&color=fff`
      };
      
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      return mockUser;
    }

    try {
      const signInInput: SignInInput = {
        username: email,
        password
      };

      const { isSignedIn, nextStep } = await signIn(signInInput);

      if (!isSignedIn) {
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          throw new Error('Please confirm your email address before signing in');
        }
        throw new Error('Sign in failed');
      }

      // Get user details after successful sign in
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Failed to get user details after sign in');
      }

      return currentUser;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Cognito errors
      switch (error.name) {
        case 'UserNotConfirmedException':
          throw new Error('Please confirm your email address before signing in');
        case 'NotAuthorizedException':
          throw new Error('Invalid email or password');
        case 'UserNotFoundException':
          throw new Error('No account found with this email address');
        case 'TooManyRequestsException':
          throw new Error('Too many failed attempts. Please try again later');
        default:
          throw new Error(error.message || 'Login failed');
      }
    }
  }

  /**
   * Sign up with email, password, name, and campus
   */
  async signup(name: string, email: string, password: string, campus: string): Promise<SignUpResponse> {
    // Development mode: use mock signup
    if (isDevelopmentMode()) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const mockUser: User = {
        id: Date.now().toString(),
        name,
        email,
        campus,
        joinedAt: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`
      };
      
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      return {
        isSignUpComplete: true,
        userId: mockUser.id,
        nextStep: {
          signUpStep: 'DONE'
        }
      };
    }

    try {
      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name
            // Temporarily disabled: 'custom:campus': campus
            // You need to add 'campus' as a custom attribute in AWS Cognito User Pool
          }
        }
      };

      const { isSignUpComplete, userId, nextStep } = await signUp(signUpInput);

      return {
        isSignUpComplete,
        userId,
        nextStep: {
          signUpStep: nextStep.signUpStep,
          additionalInfo: nextStep.additionalInfo
        }
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific Cognito errors
      switch (error.name) {
        case 'UsernameExistsException':
          throw new Error('An account with this email address already exists');
        case 'InvalidPasswordException':
          throw new Error('Password does not meet requirements');
        case 'InvalidParameterException':
          throw new Error('Invalid email address format');
        case 'CodeDeliveryFailureException':
          throw new Error('Failed to send confirmation code. Please try again');
        default:
          throw new Error(error.message || 'Sign up failed');
      }
    }
  }

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(email: string, confirmationCode: string): Promise<boolean> {
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode
      });

      if (!isSignUpComplete) {
        throw new Error('Email confirmation failed');
      }

      // Return success - user can now sign in
      return true;
    } catch (error: any) {
      console.error('Confirm signup error:', error);
      
      switch (error.name) {
        case 'CodeMismatchException':
          throw new Error('Invalid confirmation code');
        case 'ExpiredCodeException':
          throw new Error('Confirmation code has expired');
        case 'LimitExceededException':
          throw new Error('Too many attempts. Please request a new code');
        default:
          throw new Error(error.message || 'Email confirmation failed');
      }
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    // In development mode, check localStorage for mock user
    if (isDevelopmentMode()) {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    }

    try {
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        return null;
      }

      // Get user attributes
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        return null;
      }

      const payload = session.tokens.idToken.payload;
      
      const user: User = {
        id: currentUser.userId,
        name: payload.name as string || '',
        email: payload.email as string || '',
        campus: payload['custom:campus'] as string || '',
        joinedAt: new Date(payload.iat! * 1000).toISOString(), // Convert from Unix timestamp
        avatar: payload.picture as string || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name as string || '')}&background=10b981&color=fff`
      };

      return user;
    } catch (error: any) {
      if (!isDevelopmentMode()) {
        console.error('Get current user error:', error);
      }
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    // Development mode: clear localStorage
    if (isDevelopmentMode()) {
      localStorage.removeItem('currentUser');
      return;
    }

    try {
      await signOut();
    } catch (error: any) {
      console.error('Logout error:', error);
      // Don't throw error on logout - always allow user to sign out from UI perspective
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      return !!currentUser;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user session and tokens
   */
  async getSession(): Promise<any> {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch (error: any) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get auth token for API calls
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error: any) {
      console.error('Get auth token error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication session
   */
  async refreshSession(): Promise<void> {
    try {
      await fetchAuthSession({ forceRefresh: true });
    } catch (error: any) {
      console.error('Refresh session error:', error);
      throw new Error('Failed to refresh session');
    }
  }
}

export const authService = new AuthService();