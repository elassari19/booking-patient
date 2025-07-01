import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import { logout } from '../slices/authSlice';

// Updated base URL with proper environment handling
const BASE_URL = __DEV__
  ? 'http://localhost:3000/api' // Your backend runs on port 3000
  : 'https://your-production-api.com/api';

// Enhanced base query with proper typing for persisted state
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include', // Include cookies for session-based auth
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;

    // Check if auth exists and has been rehydrated
    const token = state.auth?.token;

    // Add authorization header if token exists
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    // Set content type
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    // Add user agent for mobile app identification
    headers.set('User-Agent', 'PatientBookingApp/1.0.0 (Mobile)');

    return headers;
  },
});

// Enhanced base query with re-authentication logic
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized - session expired or invalid
  if (result.error && result.error.status === 401) {
    console.log('Session expired, logging out user');

    // Dispatch logout action to clear Redux state
    api.dispatch(logout());
  }

  // Handle other errors
  if (result.error && result.error.status === 403) {
    console.log('Access forbidden - insufficient permissions');
  }

  if (result.error && result.error.status === 'FETCH_ERROR') {
    console.log('Network error occurred');
  }

  if (
    result.error &&
    typeof result.error.status === 'number' &&
    result.error.status >= 500
  ) {
    console.log('Server error occurred:', result.error.status);
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Profile',
    'PatientProfile',
    'PractitionerProfile',
    'AdminProfile',
    'Booking',
    'Message',
    'Conversation',
    'Appointment',
    'Availability',
    'Session',
    'VideoCall',
    'Notification',
  ],
  keepUnusedDataFor: 60 * 5, // 5 minutes
  refetchOnReconnect: true,
  refetchOnFocus: true,
  endpoints: () => ({}),
});

// Helper function to handle API errors consistently
export const handleApiError = (
  error: FetchBaseQueryError | undefined
): string => {
  if (!error) return 'An unknown error occurred';

  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') {
      return 'Network error. Please check your connection.';
    }

    if (error.status === 'PARSING_ERROR') {
      return 'Failed to parse server response.';
    }

    if (error.status === 'TIMEOUT_ERROR') {
      return 'Request timeout. Please try again.';
    }

    if (typeof error.status === 'number') {
      switch (error.status) {
        case 400:
          return (error.data as any)?.message || 'Bad request';
        case 401:
          return 'Authentication required';
        case 403:
          return 'Access forbidden';
        case 404:
          return 'Resource not found';
        case 409:
          return (error.data as any)?.message || 'Conflict occurred';
        case 422:
          return (error.data as any)?.message || 'Validation error';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Internal server error';
        default:
          return `Server error: ${error.status}`;
      }
    }
  }

  return (error as any).message || 'An error occurred';
};

// Helper function to extract error message from API response
export const getErrorMessage = (error: any): string => {
  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.data?.errors) {
    const validationErrors = error.data.errors;
    const firstErrorKey = Object.keys(validationErrors)[0];
    if (firstErrorKey && validationErrors[firstErrorKey]?.[0]) {
      return validationErrors[firstErrorKey][0];
    }
  }

  return handleApiError(error);
};

export default apiSlice;
