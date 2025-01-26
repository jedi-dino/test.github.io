import React, { useRef, useEffect } from 'react'

interface VideoPlayerProps {
  src: string
  className?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className = '' }): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [src])

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Error loading video:', e)
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        controls
        preload="metadata"
        className="w-full rounded-lg"
        onError={handleError}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

export default VideoPlayer
