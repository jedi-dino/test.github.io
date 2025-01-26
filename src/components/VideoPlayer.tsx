interface VideoPlayerProps {
  src: string | null | undefined
  className?: string
  controls?: boolean
}

function VideoPlayer({ src, className = '', controls = true }: VideoPlayerProps) {
  if (!src) return null;

  return (
    <video 
      src={src as string} // Type assertion since we've already checked for null/undefined
      className={className}
      controls={controls}
    />
  );
}

export default VideoPlayer;
