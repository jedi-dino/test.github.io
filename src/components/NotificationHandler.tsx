import { useEffect } from 'react'

interface NotificationHandlerProps {
  onPermissionChange: (permission: NotificationPermission) => void
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({ onPermissionChange }) => {
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        if (!('Notification' in window)) {
          console.log('This browser does not support notifications')
          return
        }

        let permission = Notification.permission
        if (permission === 'default') {
          permission = await Notification.requestPermission()
        }
        onPermissionChange(permission)
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }

    requestNotificationPermission()
  }, [onPermissionChange])

  return null
}

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/notification-icon.png',
        badge: '/notification-badge.png',
        ...options
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }
}

export default NotificationHandler
