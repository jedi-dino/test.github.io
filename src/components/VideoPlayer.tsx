interface VideoPlayerProps {
  src: string | null | undefined
  className?: string
  controls?: boolean
}

function VideoPlayer({ src, className = '', controls = true }: VideoPlayerProps) {
  if (!src) return null;

  return (
    <video 
      src={src}
      className={className}
      controls={controls}
    />
  );
}

export default VideoPlayer;
