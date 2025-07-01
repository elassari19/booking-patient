import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  exponentialBackoff: boolean;
}
let lastError: Error;

export class ApiUtils {
  /**
   * Retry mechanism for failed API calls
   */
  static async withRetry<T>(
    apiCall: () => Promise<T>,
    config: RetryConfig = {
      maxAttempts: 3,
      delay: 1000,
      exponentialBackoff: true,
    }
  ): Promise<T> {
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay
        const delay = config.exponentialBackoff
          ? config.delay * Math.pow(2, attempt - 1)
          : config.delay;

        console.log(
          `API call failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  private static shouldNotRetry(error: any): boolean {
    const status = error?.response?.status;

    // Don't retry client errors (4xx) except timeout and rate limiting
    if (status >= 400 && status < 500) {
      return ![408, 429].includes(status);
    }

    return false;
  }

  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check network connectivity
   */
  static async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true;
    } catch (error) {
      console.error('Failed to check network connectivity:', error);
      return false;
    }
  }

  /**
   * Show network error alert
   */
  static showNetworkError(): void {
    Alert.alert(
      'Connection Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Handle API errors with user-friendly messages
   */
  static handleApiError(error: any, showAlert: boolean = true): string {
    let message = 'An unexpected error occurred';

    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          message = 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'Authentication required. Please log in again.';
          break;
        case 403:
          message =
            "Access denied. You don't have permission to perform this action.";
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = `Server returned error code ${error.response.status}`;
      }
    }

    if (showAlert) {
      Alert.alert('Error', message);
    }

    return message;
  }
}

export default ApiUtils;
