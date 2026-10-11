// Numéro permanent d'un artiste, d'une release ou d'un morceau (VYN-A-000003,
// VYN-R-000001, VYN-T-000005). Il ne change jamais et n'est jamais réutilisé, même si
// le compte est supprimé : c'est la référence des relevés et de la comptabilité.
export function CatalogCode({ code, label }: { code?: string | null; label?: string }) {
  if (!code) return null;
  return (
    <span className="catalog-code" title="Permanent catalog number">
      {label && <span className="catalog-code__label">{label}</span>}
      {code}
    </span>
  );
}
