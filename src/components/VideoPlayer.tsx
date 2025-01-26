interface VideoPlayerProps {
  src: string | null | undefined
  className?: string
  controls?: boolean
}

function VideoPlayer({ src, className = '', controls = true }: VideoPlayerProps) {
  // Convert null to undefined for the source element
  const videoSrc = src || undefined;
  
  if (!videoSrc) return null;

  // Determine video type from src
  const getVideoType = (url: string) => {
    if (url.includes('data:video/mp4')) return 'video/mp4';
    if (url.includes('data:video/webm')) return 'video/webm';
    if (url.endsWith('.mp4')) return 'video/mp4';
    if (url.endsWith('.webm')) return 'video/webm';
    return 'video/mp4'; // default to mp4
  };

  const videoType = getVideoType(videoSrc);

  return (
    <video 
      className={className}
      controls={controls}
    >
      <source src={videoSrc} type={videoType} />
      Your browser does not support the video tag.
    </video>
  );
}

export default VideoPlayer;
