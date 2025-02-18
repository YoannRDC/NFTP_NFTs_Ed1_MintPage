export default function VideoPresentation() {
    return (
      <div style={{ position: 'relative', textAlign: 'center', width: '50%', height: '300px' }}>
        <iframe
          src="https://youtube.com/embed/i3-5yO6GXw0?rel=0&modestbranding=1&autoplay=0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'relative', top: 10, left: 0, width: '100%', height: '100%',  textAlign: 'center' }}
          title="Présentation NFT Propulsion"
        ></iframe>
      </div>
    );
  }
  