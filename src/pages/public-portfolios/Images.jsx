import { useState, useEffect, useRef } from "react";
import { validEpisode } from "./lib.js";
import { pngArchive } from "./archive.js";
import { renderImages } from "./images.js";
import { downloadPublicationBlob } from "../../design-system/downloadBlob.js";
import { downloadImage } from "../../design-system/downloadImage.js";

export default function Images({
  profile,
  snapshot,
  episode,
  preview = false,
  version = 2,
}) {
  const ref = useRef(),
    [canvases, setCanvases] = useState([]);
  useEffect(() => {
    if (!validEpisode(episode) || !ref.current) {
      setCanvases([]);
      return;
    }
    const cs = renderImages(profile, snapshot, episode, { preview, version });
    ref.current.replaceChildren(...cs);
    setCanvases(cs);
  }, [profile, snapshot, episode, preview, version]);
  if (!validEpisode(episode))
    return <p>Numéro d’épisode valide requis (1 à 999999).</p>;
  return (
    <section>
      <h3>{preview ? "Aperçu des images" : "Images 1 080 × 1 350"}</h3>
      <div ref={ref} className="pp-images" />
      {!preview &&
        canvases.map((c, i) => (
          <button
            key={i}
            onClick={() =>
              downloadImage(c, `portefeuille-${episode}-${i + 1}.png`)
            }
          >
            Télécharger image {i + 1}
          </button>
        ))}
      {!preview && (
        <button
          onClick={() =>
            downloadPublicationBlob(
              pngArchive(
                canvases.map((c, i) => ({
                  name: `portefeuille-${episode}-${i + 1}.png`,
                  data: Uint8Array.from(
                    atob(c.toDataURL("image/png").split(",")[1]),
                    (ch) => ch.charCodeAt(0),
                  ),
                })),
              ),
              `portefeuille-${episode}.zip`,
              60000,
            )
          }
        >
          Télécharger toutes les images (ZIP)
        </button>
      )}
    </section>
  );
}
