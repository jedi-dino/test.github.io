const DEFAULT_API_URL = 'https://testserverprobsfail.replit.app'
export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout'
  },
  USERS: {
    SEARCH: '/api/users/search',
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/update',
    UPDATE_PROFILE_PICTURE: '/api/users/profile-picture',
    REMOVE_PROFILE_PICTURE: '/api/users/profile-picture'
  },
  MESSAGES: {
    SEND: '/api/messages',
    GET: '/api/messages',
    RECENT: '/api/messages/recent/chats',
    READ: '/api/messages/read'
  }
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm']
}

export const MESSAGE_POLL_INTERVAL = 5000
export const RECENT_CHATS_POLL_INTERVAL = 10000

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  SELECTED_CHAT_USER: 'selectedChatUser',
  THEME: 'theme'
}

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
} as const

export const DEFAULT_THEME = THEMES.LIGHT

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
}

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
}

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    return response.ok
  } catch {
    return false
  }
}

export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000
): Promise<Response> => {
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }

  try {
    const response = await fetch(url, finalOptions)
    if (response.ok) return response
    
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  } catch (error) {
    if (retries === 0) throw error
    await new Promise(resolve => setTimeout(resolve, delay))
    return fetchWithRetry(url, finalOptions, retries - 1, delay * 2)
  }
}
