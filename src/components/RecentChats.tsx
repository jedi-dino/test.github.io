import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'

interface RecentChat {
  id: string
  username: string
  lastMessage: {
    content: string
    mediaType: 'image' | 'video' | null
    createdAt: string
    read: boolean
    sender: {
      _id: string
    }
  }
}

interface RecentChatsProps {
  token: string
  currentUserId: string
  onSelectUser: (user: { id: string; username: string }) => void
  selectedUserId?: string
}

const RecentChats: React.FC<RecentChatsProps> = ({ token, currentUserId, onSelectUser, selectedUserId }) => {
  const [chats, setChats] = useState<RecentChat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentChats()
    // Poll for new chats every 10 seconds
    const interval = setInterval(fetchRecentChats, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchRecentChats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${API_URL}/api/messages/recent/chats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Error fetching chats: ${response.status}`)
      }

      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error('Error fetching recent chats:', error)
      setError(error instanceof Error ? error.message : 'Error fetching chats')
    } finally {
      setIsLoading(false)
    }
  }

  const formatLastMessage = (chat: RecentChat) => {
    if (chat.lastMessage.mediaType === 'image') {
      return '📷 Image'
    } else if (chat.lastMessage.mediaType === 'video') {
      return '🎥 Video'
    } else {
      return chat.lastMessage.content || 'No message'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchRecentChats}
          className="mt-2 text-blue-500 hover:text-blue-600"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isLoading && chats.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">No recent chats</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Start a new chat to begin messaging
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {chats.map(chat => (
        <button
          key={chat.id}
          onClick={() => onSelectUser({ id: chat.id, username: chat.username })}
          className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
            chat.id === selectedUserId ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {chat.username}
              </p>
              <p className={`text-sm truncate ${
                !chat.lastMessage.read && chat.lastMessage.sender._id !== currentUserId
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatLastMessage(chat)}
              </p>
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(chat.lastMessage.createdAt)}
              </p>
              {!chat.lastMessage.read && chat.lastMessage.sender._id !== currentUserId && (
                <div className="mt-1 h-2 w-2 bg-blue-500 rounded-full ml-auto"></div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default RecentChats
