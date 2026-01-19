import { useState } from "react";
import { Play } from "lucide-react";

interface InnovationVideoProps {
  videoId: string; 
}

export function InnovationVideo({ videoId }: InnovationVideoProps) {
  const [play, setPlay] = useState(false);

  const preview = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embed = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  return (
    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-black">
      {!play ? (
        <>
          <img
            src={preview}
            alt="Video preview"
            className="w-full h-full object-cover"
          />

          <button
            onClick={() => setPlay(true)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                       bg-blue-600 hover:bg-blue-700 text-white rounded-full
                       p-4 shadow-xl transition"
          >
            <Play className="w-4 h-4 fill-white" />
          </button>
        </>
      ) : (
        <iframe
          className="w-full h-full"
          src={embed}
          title="YouTube video"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
