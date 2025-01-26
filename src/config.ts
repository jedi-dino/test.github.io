// Use Replit backend URL with explicit HTTPS protocol
export const API_URL = 'https://testserverprobsfail.replit.app';

// Network timeout in milliseconds
export const REQUEST_TIMEOUT = 10000;

// Retry configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // milliseconds

// API endpoints
export const ENDPOINTS = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  users: '/api/users',
  messages: '/api/messages'
};

// Helper function to check if the API is available
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${API_URL}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Helper function to handle API requests with retries
export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
