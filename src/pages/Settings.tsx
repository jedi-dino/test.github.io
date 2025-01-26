import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { API_URL } from '../config'

interface SettingsProps {
  user: {
    id: string
    username: string
    token: string
  }
}

function Settings({ user }: SettingsProps) {
  const [newUsername, setNewUsername] = useState(user.username)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update username')
      }

      setSuccess('Username updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/users/password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update password')
      }

      setSuccess('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            {/* Theme Settings */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Profile Settings */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile</h2>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="mt-1 input dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Username
                </button>
              </form>
            </div>

            {/* Password Settings */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 input dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 input dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 input dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/50 p-4">
              <div className="text-sm text-green-700 dark:text-green-200">{success}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
