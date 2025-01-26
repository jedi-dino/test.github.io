import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { API_URL, ENDPOINTS, checkApiHealth, fetchWithRetry } from '../config'

interface RegisterProps {
  onRegister: (userData: { id: string; username: string; token: string }) => void
}

function Register({ onRegister }: RegisterProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isApiAvailable, setIsApiAvailable] = useState(true)

  useEffect(() => {
    const checkApi = async () => {
      const isAvailable = await checkApiHealth();
      setIsApiAvailable(isAvailable);
      if (!isAvailable) {
        setError('Unable to connect to server. Please try again later.');
      }
    };
    checkApi();
  }, []);

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError('Username must be 3-30 characters long and can only contain letters, numbers, and underscores');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isApiAvailable) {
      setError('Server is currently unavailable. Please try again later.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Making registration request to:', `${API_URL}${ENDPOINTS.register}`)
      
      const response = await fetchWithRetry(`${API_URL}${ENDPOINTS.register}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({ username: username.trim(), password })
      });

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      let data
      const contentType = response.headers.get('content-type')
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
          console.log('Response data:', data)
        } else {
          const text = await response.text()
          console.log('Raw response:', text)
          throw new Error('Server returned non-JSON response')
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        throw new Error('Failed to parse server response')
      }

      if (!response.ok) {
        throw new Error(data?.message || `Registration failed with status ${response.status}`)
      }

      if (!data.id || !data.username || !data.token) {
        console.error('Invalid response format:', data)
        throw new Error('Server returned invalid data format')
      }

      onRegister(data)
    } catch (err) {
      console.error('Registration error:', err)
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.')
      } else if (err instanceof Error && err.message.includes('timeout')) {
        setError('Request timed out. Please try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <Logo />
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              sign in to your account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input rounded-t-md dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading || !isApiAvailable}
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_]{3,30}$"
                title="Username must be 3-30 characters long and can only contain letters, numbers, and underscores"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading || !isApiAvailable}
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="input rounded-b-md dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading || !isApiAvailable}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              className="btn btn-primary w-full dark:hover:bg-blue-700"
              disabled={isLoading || !isApiAvailable}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
