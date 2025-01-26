// API URL (pointing to Replit backend)
export const API_URL = 'https://chat-app.yourusername.repl.co';

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout'
  },
  USERS: {
    SEARCH: '/api/users/search',
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/update'
  },
  MESSAGES: {
    SEND: '/api/messages',
    GET: '/api/messages',
    RECENT: '/api/messages/recent/chats',
    READ: '/api/messages/read'
  }
};

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm']
};

// Message polling interval (in milliseconds)
export const MESSAGE_POLL_INTERVAL = 5000;

// Recent chats polling interval (in milliseconds)
export const RECENT_CHATS_POLL_INTERVAL = 10000;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  SELECTED_CHAT_USER: 'selectedChatUser',
  THEME: 'theme'
};

// Theme settings
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
} as const;

// Default theme
export const DEFAULT_THEME = THEMES.LIGHT;

// Validation rules
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50
  },
  MESSAGE: {
    MAX_LENGTH: 1000
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Please log in to continue.',
  FILE_TOO_LARGE: 'File must be less than 10MB',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image or video.',
  VALIDATION: {
    USERNAME_REQUIRED: 'Username is required',
    USERNAME_LENGTH: `Username must be between ${VALIDATION.USERNAME.MIN_LENGTH} and ${VALIDATION.USERNAME.MAX_LENGTH} characters`,
    USERNAME_PATTERN: 'Username can only contain letters, numbers, and underscores',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_LENGTH: `Password must be between ${VALIDATION.PASSWORD.MIN_LENGTH} and ${VALIDATION.PASSWORD.MAX_LENGTH} characters`,
    MESSAGE_LENGTH: `Message cannot exceed ${VALIDATION.MESSAGE.MAX_LENGTH} characters`
  }
};

// API utilities
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;
    throw new Error(`HTTP error! status: ${response.status}`);
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
};
