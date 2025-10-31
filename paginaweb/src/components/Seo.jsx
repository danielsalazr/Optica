import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "Bienestar Óptica";
const SITE_URL = "https://www.bienestaroptica.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

function Seo({ title, description, canonical, image, url, jsonLd }) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Salud visual integral`;
  const pageDescription =
    description ||
    "Especialistas en optometría, monturas y brigadas empresariales en Cali. Agenda tu cita y recibe atención personalizada.";
  const pageUrl = canonical || url || SITE_URL;
  const pageImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={pageImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      {canonical && <link rel="canonical" href={canonical} />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

export default Seo;
