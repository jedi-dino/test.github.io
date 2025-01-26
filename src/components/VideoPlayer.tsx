interface VideoPlayerProps {
  src: string | null | undefined
  className?: string
  controls?: boolean
}

function VideoPlayer({ src, className = '', controls = true }: VideoPlayerProps) {
  // Early return if no source
  if (!src) return null;

  // Create a URL object from the source
  let videoUrl: string;
  try {
    const url = new URL(src);
    videoUrl = url.toString();
  } catch {
    // If not a valid URL, use the string directly (e.g., for data URLs)
    videoUrl = src;
  }

  return (
    <video 
      className={className}
      controls={controls}
      autoPlay={false}
      src={videoUrl}
    >
      Your browser does not support the video tag.
    </video>
  );
}

export default VideoPlayer;
