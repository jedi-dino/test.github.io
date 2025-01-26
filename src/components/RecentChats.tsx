import React, { useState, useEffect } from 'react'
import { API_URL, ENDPOINTS } from '../config'
import ProfilePicture from './ProfilePicture'

interface ChatUser {
  id: string
  username: string
}

interface RecentChat {
  user: ChatUser
  lastMessage: {
    content: string
    createdAt: string
    mediaType: 'image' | 'video' | null
  }
  unreadCount: number
}

interface RecentChatsProps {
  token: string
  currentUserId: string
  onSelectUser: (user: ChatUser) => void
  selectedUserId?: string
}

const RecentChats: React.FC<RecentChatsProps> = ({
  token,
  currentUserId,
  onSelectUser,
  selectedUserId
}): JSX.Element => {
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRecentChats = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.MESSAGES.RECENT}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recent chats')
      }

      const data = await response.json()
      setRecentChats(data)
    } catch (error) {
      setError('Failed to load recent chats')
      console.error('Error fetching recent chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentChats()
    const interval = setInterval(fetchRecentChats, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [token])

  const formatLastMessage = (chat: RecentChat) => {
    if (chat.lastMessage.mediaType === 'image') {
      return '📷 Image'
    } else if (chat.lastMessage.mediaType === 'video') {
      return '🎥 Video'
    }
    return chat.lastMessage.content
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days > 7) {
      return date.toLocaleDateString()
    } else if (days > 0) {
      return `${days}d ago`
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 0) {
      return `${hours}h ago`
    }

    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes > 0) {
      return `${minutes}m ago`
    }

    return 'Just now'
  }

  if (isLoading && recentChats.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchRecentChats}
          className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (recentChats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No recent chats
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {recentChats.map((chat) => (
        <button
          key={chat.user.id}
          onClick={() => onSelectUser(chat.user)}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            chat.user.id === selectedUserId
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <div className="relative">
            <ProfilePicture username={chat.user.username} size="md" />
            {chat.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {chat.unreadCount}
              </div>
            )}
          </div>
          <div className="ml-3 flex-1 text-left">
            <div className="flex justify-between items-baseline">
              <span
                className={`font-medium ${
                  chat.unreadCount > 0
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {chat.user.username}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(chat.lastMessage.createdAt)}
              </span>
            </div>
            <p
              className={`text-sm truncate ${
                chat.unreadCount > 0
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {formatLastMessage(chat)}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

export default RecentChats
