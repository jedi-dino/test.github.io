import { useState, useEffect } from 'react'
import { API_URL } from '../config'

interface Message {
  id: string
  content: string
  timestamp: string
  senderId: string
  receiverId: string
  read: boolean
}

interface ChatUser {
  id: string
  username: string
}

interface Conversation {
  user: ChatUser
  lastMessage: Message
  unreadCount: number
}

interface RecentChatsProps {
  token: string
  currentUserId: string
  onSelectUser: (user: ChatUser) => void
  selectedUserId?: string
}

function RecentChats({ token, currentUserId, onSelectUser, selectedUserId }: RecentChatsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Failed to fetch conversations: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response format')
      }

      const data = await response.json()
      setConversations(Array.isArray(data) ? data : [])
      setError(null)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError(error instanceof Error ? error.message : 'Failed to load recent conversations')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 py-4">
        {error}
        <button
          onClick={fetchConversations}
          className="block mx-auto mt-2 text-blue-500 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          No recent conversations
        </p>
      ) : (
        conversations.map((conversation) => (
          <button
            key={conversation.user.id}
            onClick={() => onSelectUser(conversation.user)}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              selectedUserId === conversation.user.id ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold">
                {conversation.user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {conversation.user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {formatTimestamp(conversation.lastMessage.timestamp)}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                    {conversation.lastMessage.content}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  )
}

export default RecentChats
