// Aperçu de ce que voient les auditeurs : l'en-tête de la page artiste, puis la carte (Discover,
// Bibliothèque) et la ligne de la recherche. Reprend les formats de l'app d'écoute : bannière en
// `cover` centrée, photo ronde, et le vinyle vide quand il n'y a pas d'image.
function photo(url: string | null): string {
  return url ? `url("${url}") center/cover` : "var(--vynl-pochette-vide)";
}

export function ArtistPreview({
  name,
  bio,
  avatarUrl,
  bannerUrl,
}: {
  name: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}) {
  const text = bio.trim();
  return (
    <div className="artist-preview" aria-label="Preview of your public page">
      <div className="artist-preview__page">
        <div
          className="artist-preview__banner"
          style={{ background: bannerUrl ? `url("${bannerUrl}") center/cover` : "var(--vynl-banniere-vide)" }}
        />
        <div className="artist-preview__body">
          <span className="artist-preview__avatar" style={{ background: photo(avatarUrl) }} />
          <strong className="artist-preview__name">{name}</strong>
          {text && <p className="artist-preview__bio">{text}</p>}
        </div>
      </div>

      <div className="artist-preview__small">
        <figure className="artist-preview__card">
          <span className="artist-preview__circle artist-preview__circle--lg" style={{ background: photo(avatarUrl) }} />
          <figcaption>{name}</figcaption>
          <span className="artist-preview__where">Discover</span>
        </figure>
        <figure className="artist-preview__row">
          <span className="artist-preview__circle artist-preview__circle--sm" style={{ background: photo(avatarUrl) }} />
          <figcaption>{name}</figcaption>
          <span className="artist-preview__where">Search</span>
        </figure>
      </div>
    </div>
  );
}
