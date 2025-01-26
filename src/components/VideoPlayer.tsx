interface VideoPlayerProps {
  src: string | null | undefined
  className?: string
  controls?: boolean
}

function VideoPlayer({ src, className = '', controls = true }: VideoPlayerProps) {
  if (!src) return null;

  return (
    <video 
      className={className}
      controls={controls}
    >
      <source src={src} type="video/mp4" />
      <source src={src} type="video/webm" />
      Your browser does not support the video tag.
    </video>
  );
}

export default VideoPlayer;
