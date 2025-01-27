import React, { useState } from 'react'
import { API_URL, ENDPOINTS } from '../config'
import ProfilePicture from './ProfilePicture'

interface User {
  id: string
  username: string
}

interface UserSearchProps {
  onSelectUser: (user: { id: string; username: string }) => void
  currentUserId: string
  token: string
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser, currentUserId, token }): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)

    if (!term.trim()) {
      setUsers([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}${ENDPOINTS.USERS.SEARCH}?query=${encodeURIComponent(term)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to search users')
      }

      const data = await response.json()
      if (data.status === 'success' && Array.isArray(data.users)) {
        setUsers(data.users.filter((user: User) => user.id !== currentUserId))
      } else {
        setUsers([])
      }
    } catch (error) {
      setError('Failed to search users')
      console.error('Error searching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search users..."
          className="input w-full"
        />
        {isLoading && (
          <div className="absolute right-3 top-2">
            <div className="spinner h-6 w-6"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-4 space-y-2">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ProfilePicture username={user.username} size="sm" />
            <span className="ml-3 text-gray-900 dark:text-white">
              {user.username}
            </span>
          </button>
        ))}
        {searchTerm && !isLoading && users.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No users found
          </p>
        )}
      </div>
    </div>
  )
}

export default UserSearch
