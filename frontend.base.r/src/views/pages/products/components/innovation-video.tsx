import { useState } from "react";
import { Play } from "lucide-react";

interface InnovationVideoProps {
  videoId: string;
}

export function InnovationVideo({ videoId }: InnovationVideoProps) {
  const [play, setPlay] = useState(false);

  return (
    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-black">
      {!play ? (
        <>
          <img
            src={videoId}
            alt="Video preview"
            className="w-full h-full object-cover"
          />

          <button
            onClick={() => setPlay(true)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                       bg-blue-600 hover:bg-blue-700 text-white rounded-full
                       p-6 shadow-xl transition"
          >
            <Play className="w-8 h-8 fill-white" />
          </button>
        </>
      ) : (
        <iframe
          className="w-full h-full"
          src={videoId}
          title="YouTube video"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
