import React from 'react'
import { Link } from 'react-router-dom'
import ProfilePicture from '../components/ProfilePicture'

interface SettingsProps {
  user: {
    id: string
    username: string
    token: string
  }
  onLogout: () => void
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }): JSX.Element => {
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
              <div className="flex space-x-4">
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
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Username
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.username}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.id}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Theme
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    Using system theme preferences
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
