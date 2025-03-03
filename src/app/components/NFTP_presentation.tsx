// components/NFTP_presentation.tsx

interface VideoPresentationProps {
  src: string;
  title: string;
}

export default function VideoPresentation({ src, title }: VideoPresentationProps) {
  return (
    <div className="w-full h-full">
      <iframe
        src={src}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        title={title}
      ></iframe>
    </div>
  );
}
