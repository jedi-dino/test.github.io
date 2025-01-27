import React, { useState } from 'react'

interface ProfilePictureProps {
  username: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ username, imageUrl, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false)

  const getColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = hash % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const renderFallback = () => (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: getColor(username) }}
    >
      {getInitials(username)}
    </div>
  )

  if (imageUrl && !imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800`}>
        <img 
          src={imageUrl}
          alt={`${username}'s profile`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  return renderFallback()
}

export default ProfilePicture
