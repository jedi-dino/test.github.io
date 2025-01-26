import React from 'react'

interface ProfilePictureProps {
  username: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ username, size = 'md', className = '' }) => {
  // Generate a color based on username
  const getColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = hash % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  // Get initials from username
  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: getColor(username) }}
    >
      {getInitials(username)}
    </div>
  )
}

export default ProfilePicture
