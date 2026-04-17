import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'UrgenteYa.cl';
const SITE_URL  = 'https://urgenteya.cl';
const DEFAULT_DESC = 'Directorio de maestros independientes en Chile. Encuentra electricistas, gasfíteres, refrigeración y más cerca de ti. Contacto directo, sin intermediarios.';
const DEFAULT_IMG  = `${SITE_URL}/og-image.jpg`;

export default function SEO({ title, description, image, url, noindex = false, jsonLd = null }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Maestros de confianza en Chile`;
  const desc      = description || DEFAULT_DESC;
  const img       = image || DEFAULT_IMG;
  const canonical = url ? `${SITE_URL}${url}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={img} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={img} />

      {/* JSON-LD estructurado */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
