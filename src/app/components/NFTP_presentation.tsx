export default function VideoPresentation() {
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
        <iframe
          src="https://www.youtube.com/embed/jtMNejMvX0k"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          title="Présentation NFT Propulsion"
        ></iframe>
      </div>
    );
  }
  