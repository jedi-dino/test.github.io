import { useState, useEffect } from 'react'
import { API_URL } from '../config'

interface Message {
  _id: string
  content: string
  createdAt: string
  read: boolean
}

interface ChatUser {
  _id: string
  username: string
  profilePicture?: string
}

interface Conversation {
  user: ChatUser
  lastMessage: Message
  unreadCount: number
}

interface RecentChatsProps {
  token: string
  currentUserId: string
  onSelectUser: (user: { id: string; username: string }) => void
  selectedUserId?: string
}

function RecentChats({ token, currentUserId, onSelectUser, selectedUserId }: RecentChatsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [currentUserId])

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
      console.log('Recent conversations response:', data);
      // Filter out conversations with the current user
      const filteredConversations = Array.isArray(data) 
        ? data.filter(conv => conv.user._id !== currentUserId)
        : [];
      setConversations(filteredConversations)
      setError(null)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError(error instanceof Error ? error.message : 'Failed to load recent conversations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the conversation selection
    setDeletingId(userId)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/messages/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete conversation')
      }

      console.log('Delete response:', data)

      // Remove the conversation from the list
      setConversations(prev => prev.filter(conv => conv.user._id !== userId))
      
      // If this was the selected conversation, clear it
      if (selectedUserId === userId) {
        onSelectUser({ id: '', username: '' })
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete conversation')
    } finally {
      setDeletingId(null)
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
          <div
            key={conversation.user._id}
            className={`relative group ${
              selectedUserId === conversation.user._id ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            <button
              onClick={() => onSelectUser({
                id: conversation.user._id,
                username: conversation.user.username
              })}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {conversation.user.profilePicture ? (
                    <img 
                      src={conversation.user.profilePicture} 
                      alt={conversation.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    conversation.user.username.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {formatTimestamp(conversation.lastMessage.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
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
            <button
              onClick={(e) => handleDelete(conversation.user._id, e)}
              disabled={deletingId === conversation.user._id}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
              title="Delete conversation"
            >
              {deletingId === conversation.user._id ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
              ) : (
                <svg 
                  className="h-5 w-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          </div>
        ))
      )}
    </div>
  )
}

export default RecentChats
