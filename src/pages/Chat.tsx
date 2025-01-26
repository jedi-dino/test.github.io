import React, { useState, useRef, useEffect } from 'react'
import UserSearch from '../components/UserSearch'
import UserMenu from '../components/UserMenu'
import RecentChats from '../components/RecentChats'
import VideoPlayer from '../components/VideoPlayer'
import { API_URL, ENDPOINTS } from '../config'

interface Message {
  _id: string
  sender: {
    _id: string
    username: string
  }
  recipient: {
    _id: string
    username: string
  }
  content: string
  mediaType: 'image' | 'video' | null
  mediaUrl: string | null
  createdAt: string
  read: boolean
}

interface ChatUser {
  id: string
  username: string
}

interface ChatProps {
  user: {
    id: string
    username: string
    token: string
  }
  onLogout: () => void
}

const Chat: React.FC<ChatProps> = ({ user, onLogout }): JSX.Element => {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const pollInterval = useRef<number | null>(null)
  const isInitialLoad = useRef(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const savedUser = localStorage.getItem('selectedChatUser')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setSelectedUser(parsedUser)
        isInitialLoad.current = true
      } catch (error) {
        console.error('Error parsing saved user:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('selectedChatUser', JSON.stringify(selectedUser))
      
      if (isInitialLoad.current) {
        fetchMessages()
        isInitialLoad.current = false
      }

      pollInterval.current = window.setInterval(fetchMessages, 5000)
    }

    return () => {
      if (pollInterval.current) {
        window.clearInterval(pollInterval.current)
      }
    }
  }, [selectedUser])

  const fetchMessages = async () => {
    if (!selectedUser) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `${API_URL}${ENDPOINTS.MESSAGES.GET}/${selectedUser.id}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB')
      return
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('File must be an image or video')
      return
    }

    setSelectedMedia(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setMediaPreview(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const clearMedia = () => {
    setSelectedMedia(null)
    setMediaPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || (!newMessage.trim() && !selectedMedia)) return

    try {
      let media = null
      if (selectedMedia) {
        const reader = new FileReader()
        media = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result)
          reader.readAsDataURL(selectedMedia)
        })
      }

      const response = await fetch(`${API_URL}${ENDPOINTS.MESSAGES.SEND}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          content: newMessage.trim(),
          media
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data])
      setNewMessage('')
      clearMedia()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleSelectUser = (chatUser: ChatUser) => {
    setSelectedUser(chatUser)
    setMessages([])
    setIsSearching(false)
    isInitialLoad.current = true
  }

  const renderMessageContent = (message: Message) => {
    return (
      <div>
        {message.content && <p className="mb-2">{message.content}</p>}
        {message.mediaUrl && (
          <div className="mt-2">
            {message.mediaType === 'image' ? (
              <img 
                src={message.mediaUrl} 
                alt="Message attachment" 
                className="max-w-xs rounded-lg cursor-pointer"
                onClick={() => window.open(message.mediaUrl!, '_blank')}
              />
            ) : message.mediaType === 'video' && message.mediaUrl ? (
              <div className="max-w-xs rounded-lg overflow-hidden">
                <VideoPlayer src={message.mediaUrl} />
              </div>
            ) : null}
          </div>
        )}
        <p className={`text-xs mt-1 ${
          message.sender._id === user.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    )
  }

  const renderMediaPreview = () => {
    if (!mediaPreview || !selectedMedia) return null

    return (
      <div className="mb-4 relative inline-block">
        {selectedMedia.type.startsWith('image/') ? (
          <img 
            src={mediaPreview}
            alt="Upload preview" 
            className="max-h-32 rounded-lg"
          />
        ) : selectedMedia.type.startsWith('video/') ? (
          <div className="max-h-32 rounded-lg overflow-hidden">
            <VideoPlayer src={mediaPreview} />
          </div>
        ) : null}
        <button
          onClick={clearMedia}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
            <UserMenu user={user} onLogout={onLogout} />
          </div>
          <div className="mt-4">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="btn btn-secondary w-full dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {isSearching ? '← Back to Chats' : 'Start New Chat'}
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="p-4">
              <UserSearch 
                onSelectUser={handleSelectUser} 
                currentUserId={user.id}
                token={user.token}
              />
            </div>
          ) : (
            <RecentChats
              token={user.token}
              currentUserId={user.id}
              onSelectUser={handleSelectUser}
              selectedUserId={selectedUser?.id}
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedUser.username}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {isLoading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`mb-4 flex ${
                      message.sender._id === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                        message.sender._id === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {renderMessageContent(message)}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              {renderMediaPreview()}
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !selectedMedia}
                  className="btn btn-primary dark:hover:bg-blue-700"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
