import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useForgotPasswordMutation,
  useVerifyEmailMutation,
  useResetPasswordMutation,
  useResendVerificationMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
} from '@/store/api/authApi';
import {
  setCredentials,
  logout as logoutAction,
  setError,
  clearError,
  setLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '@/store/slices/authSlice';
import { OTPVerificationRequest } from '../types/auth';

export const useAuth = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  // RTK Query mutations
  const [loginMutation, { isLoading: loginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: registerLoading }] =
    useRegisterMutation();
  const [logoutMutation, { isLoading: logoutLoading }] = useLogoutMutation();
  const [forgotPasswordMutation, { isLoading: forgotLoading }] =
    useForgotPasswordMutation();
  const [verifyEmailMutation, { isLoading: verifyEmailLoading }] =
    useVerifyEmailMutation();
  const [resetPasswordMutation, { isLoading: resetPasswordLoading }] =
    useResetPasswordMutation();
  const [resendVerificationMutation, { isLoading: resendVerificationLoading }] =
    useResendVerificationMutation();
  const [verifyOTPMutation, { isLoading: verifyLoading }] =
    useVerifyOTPMutation();
  const [resendOTPMutation, { isLoading: resendLoading }] =
    useResendOTPMutation();

  // Get current user query
  const {
    data: currentUser,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Enhanced login function
  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      dispatch(setLoading(true));
      try {
        const result = await loginMutation(credentials).unwrap();
        dispatch(setCredentials({ user: result.user, token: result.token }));
        return result;
      } catch (error: any) {
        const errorMessage =
          error?.data?.message || 'Login failed. Please try again.';
        dispatch(setError(errorMessage));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [loginMutation, dispatch]
  );

  // Enhanced register function
  const register = useCallback(
    async (userData: any) => {
      dispatch(setLoading(true));
      try {
        const result = await registerMutation(userData).unwrap();
        return result;
      } catch (error: any) {
        const errorMessage =
          error?.data?.message || 'Registration failed. Please try again.';
        dispatch(setError(errorMessage));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [registerMutation, dispatch]
  );

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      dispatch(logoutAction());
    }
  }, [logoutMutation, dispatch]);

  // Forgot password function
  const forgotPassword = useCallback(
    async (email: string) => {
      try {
        const result = await forgotPasswordMutation({ email }).unwrap();
        return result;
      } catch (error: any) {
        const errorMessage =
          error?.data?.message || 'Failed to send reset email.';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [forgotPasswordMutation, dispatch]
  );

  // Verify email function
  const verifyEmail = useCallback(
    async (token: string) => {
      try {
        const result = await verifyEmailMutation({ token }).unwrap();
        return result;
      } catch (error: any) {
        const errorMessage =
          error?.data?.message || 'Email verification failed.';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [verifyEmailMutation, dispatch]
  );

  // Reset password function
  const resetPassword = useCallback(
    async (token: string, password: string) => {
      try {
        const result = await resetPasswordMutation({
          token,
          password,
        }).unwrap();
        return result;
      } catch (error: any) {
        const errorMessage = error?.data?.message || 'Password reset failed.';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [resetPasswordMutation, dispatch]
  );

  // Resend verification function
  const resendVerification = useCallback(
    async (email: string) => {
      try {
        const result = await resendVerificationMutation({ email }).unwrap();
        return result;
      } catch (error: any) {
        const errorMessage =
          error?.data?.message || 'Failed to resend verification email.';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [resendVerificationMutation, dispatch]
  );

  // Verify OTP function
  const verifyOTP = useCallback(
    async (data: OTPVerificationRequest) => {
      try {
        const result = await verifyOTPMutation(data).unwrap();
        return result;
      } catch (error: any) {
        const errorMessage = error?.data?.message || 'OTP verification failed.';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [verifyOTPMutation, dispatch]
  );

  // Resend OTP function
  const resendOTP = useCallback(
    async (email: string, type: string) => {
      try {
        const result = await resendOTPMutation({ email, type }).unwrap();
        return result;
      } catch (error: any) {
        const errorMessage = error?.data?.message || 'Failed to resend OTP.';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [resendOTPMutation, dispatch]
  );

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    user: user || currentUser,
    isAuthenticated,
    isLoading:
      isLoading ||
      loginLoading ||
      registerLoading ||
      logoutLoading ||
      forgotLoading ||
      verifyEmailLoading ||
      resetPasswordLoading ||
      resendVerificationLoading ||
      verifyLoading ||
      resendLoading ||
      userLoading,
    error,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    verifyEmail,
    resetPassword,
    resendVerification,
    verifyOTP,
    resendOTP,
    clearError: clearAuthError,
    refetchUser,
  };
};
