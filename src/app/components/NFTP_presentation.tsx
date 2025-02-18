// components/NFTP_presentation.tsx
export default function VideoPresentation() {
  return (
    <div className="w-full h-full">
      <iframe
        src="https://youtube.com/embed/i3-5yO6GXw0?rel=0&modestbranding=1&autoplay=0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        title="Présentation NFT Propulsion"
      ></iframe>
    </div>
  );
}
