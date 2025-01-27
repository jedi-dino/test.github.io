import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL, ENDPOINTS, THEMES, STORAGE_KEYS } from '../config'
import ProfilePicture from '../components/ProfilePicture'
import ThemeToggle from '../components/ThemeToggle'

interface User {
  id: string
  username: string
  token: string
}

interface SettingsProps {
  user: User
  onLogout: () => void
  onUpdateUser: (updatedUser: Partial<User>) => void
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout, onUpdateUser }): JSX.Element => {
  const [username, setUsername] = useState(user.username)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem(STORAGE_KEYS.THEME) || 'system')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (newTheme === 'system') {
      localStorage.removeItem(STORAGE_KEYS.THEME)
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username === user.username) return

    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.USERS.UPDATE}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ username })
      })

      const data = await response.json()
      if (data.status === 'success') {
        setSuccess('Username updated successfully')
        onUpdateUser({ username })
      } else {
        setError(data.message || 'Failed to update username')
      }
    } catch (error) {
      setError('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.USERS.UPDATE}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()
      if (data.status === 'success') {
        setSuccess('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.message || 'Failed to update password')
      }
    } catch (error) {
      setError('Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div className="flex items-center">
                <ProfilePicture username={user.username} size="lg" />
                <h3 className="ml-4 text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Account Settings
                </h3>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Link
                  to="/chat"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back to Chat
                </Link>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-400 dark:border-red-500">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="px-4 py-3 bg-green-50 dark:bg-green-900/50 border-l-4 border-green-400 dark:border-green-500">
                <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <div className="mt-1 max-w-md">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || username === user.username}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Updating...' : 'Update Username'}
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h4>
                <form onSubmit={handleChangePassword} className="mt-4 space-y-6">
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={user.username}
                    className="hidden"
                    readOnly
                  />
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Password
                    </label>
                    <div className="mt-1 max-w-md">
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Password
                    </label>
                    <div className="mt-1 max-w-md">
                      <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="mt-1 max-w-md">
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Theme Settings</h4>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        theme === 'system'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      System
                    </button>
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        theme === 'light'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
