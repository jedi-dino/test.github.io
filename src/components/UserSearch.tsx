import React, { useState } from 'react'
import { API_URL } from '../config'

interface User {
  _id: string
  username: string
}

interface UserSearchProps {
  onSelectUser: (user: { id: string; username: string }) => void
  currentUserId: string
  token: string
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser, currentUserId, token }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${API_URL}/api/users/search?username=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Error searching users: ${response.status}`)
      }

      const data = await response.json()
      // Filter out current user from results
      setUsers(data.filter((user: User) => user._id !== currentUserId))
    } catch (error) {
      console.error('Error searching users:', error)
      setError(error instanceof Error ? error.message : 'Error searching users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    searchUsers(value)
  }

  const handleSelectUser = (user: User) => {
    onSelectUser({
      id: user._id,
      username: user.username
    })
  }

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search users..."
          className="input w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 mt-2 text-sm">{error}</p>
      )}

      <div className="mt-4 space-y-2">
        {users.map(user => (
          <button
            key={user._id}
            onClick={() => handleSelectUser(user)}
            className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <div className="flex items-center">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
        {searchTerm && users.length === 0 && !isLoading && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No users found
          </p>
        )}
      </div>
    </div>
  )
}

export default UserSearch
