import React from "react";
import Info from "./Info";
import Servicios from "./Servicios";
import Monturas from "../container/Monturas";
import AcercaDeNosotros from "../container/AcercaDeNosotros";
import VisionValueSection from "./VisionValueSection";
import Seo from "./Seo";
// import Footer from './Footer';

// import '@styles/global.scss'

function MainPage() {
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "Optician",
    name: "Bienestar Óptica",
    image: "https://www.bienestaroptica.com/og-image.jpg",
    url: "https://www.bienestaroptica.com/",
    telephone: "+57 302 480 0367",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Cra. 39 #5A-65, San Fernando",
      addressLocality: "Cali",
      addressRegion: "Valle del Cauca",
      postalCode: "760001",
      addressCountry: "CO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "3.435317",
      longitude: "-76.543212",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      "https://www.facebook.com/bienestaropticacali",
      "https://www.instagram.com/bienestaropticacali/",
      "https://www.tiktok.com/@bienestar_opticacali",
    ],
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Exámenes visuales integrales",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Monturas y lentes formulados",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Brigadas empresariales de salud visual",
        },
      },
    ],
  };

  return (
    <div>
      <Seo
        title="Salud visual integral en Cali"
        description="Especialistas en optometría, monturas y lentes de contacto. Agenda exámenes visuales, brigadas empresariales y recibe asesoría personalizada en Bienestar Óptica."
        canonical="https://www.bienestaroptica.com/"
        jsonLd={businessSchema}
      />
      <Info />
      <VisionValueSection />
      {/* <Carousel /> */}
      <Servicios />

      <Monturas />
      <AcercaDeNosotros />

      {/* <Footer /> */}

      {/* <PortafolioProductos /> */}
    </div>
  );
}

export default MainPage;
