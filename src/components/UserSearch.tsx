import { useState, useEffect } from 'react'
import { API_URL } from '../config'

interface User {
  id: string
  username: string
}

interface UserSearchProps {
  onSelectUser: (user: User) => void
  currentUserId: string
  token: string
}

function UserSearch({ onSelectUser, currentUserId, token }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInitialUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/search?query=`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || `Failed to fetch users: ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned invalid response format')
        }

        const users = await response.json()
        setSearchResults(users.filter((user: User) => user.id !== currentUserId))
        setError(null)
      } catch (error) {
        console.error('Error fetching users:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch users')
        setSearchResults([])
      }
    }

    fetchInitialUsers()
  }, [currentUserId, token])

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    setError(null)

    if (!term.trim()) {
      // Fetch all users when search term is empty
      try {
        const response = await fetch(`${API_URL}/api/users/search?query=`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || `Failed to fetch users: ${response.status}`)
        }

        const users = await response.json()
        setSearchResults(users.filter((user: User) => user.id !== currentUserId))
      } catch (error) {
        console.error('Error fetching users:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch users')
        setSearchResults([])
      }
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${API_URL}/api/users/search?query=${encodeURIComponent(term)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Search failed: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response format')
      }

      const users = await response.json()
      setSearchResults(users.filter((user: User) => user.id !== currentUserId))
      setError(null)
    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          className="input w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-48 overflow-y-auto">
        {searchResults.length === 0 ? (
          <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
            {isLoading ? 'Searching...' : 'No users found'}
          </div>
        ) : (
          searchResults.map((user) => (
            <button
              key={user.id}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              onClick={() => onSelectUser(user)}
            >
              {user.username}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default UserSearch
