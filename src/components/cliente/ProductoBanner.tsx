import Image from "next/image";

// Banner de una landing de producto: hoy muestra una imagen fija, pero queda
// listo para el video publicitario (videoUrl) que reemplazará la imagen sin
// tocar el resto de la página — mientras no haya video se ve como poster.
export default function ProductoBanner({ imagen, alt, videoUrl }: { imagen: string; alt: string; videoUrl?: string }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 1", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      {videoUrl ? (
        <video
          src={videoUrl}
          poster={imagen}
          controls
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Image src={imagen} alt={alt} fill unoptimized style={{ objectFit: "cover" }} />
      )}
    </div>
  );
}
