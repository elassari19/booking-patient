import { apiSlice } from '@/store/api/apiSlice';
import { handleApiError } from '@/store/api/apiSlice';

// Centralized API service for non-auth operations
class ApiService {
  /**
   * Generic GET request handler
   */
  static async get(endpoint: string, params?: Record<string, any>) {
    try {
      const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : '';
      const response = await fetch(`${endpoint}${queryString}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  /**
   * Generic POST request handler
   */
  static async post(endpoint: string, data?: any) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }

  /**
   * Handle file uploads
   */
  static async uploadFile(
    endpoint: string,
    file: any,
    additionalData?: Record<string, any>
  ) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (additionalData) {
        Object.keys(additionalData).forEach((key) => {
          formData.append(key, additionalData[key]);
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File Upload Error:', error);
      throw error;
    }
  }

  /**
   * Check API health/connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('/health', {
        method: 'GET',
        credentials: 'include',
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export default ApiService;
