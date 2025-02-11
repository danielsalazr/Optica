import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
//import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      
        
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/css/intlTelInput.css"></link>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></link>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/css/selectize.bootstrap5.min.css" integrity="sha512-Ars0BmSwpsUJnWMw+KoUKGKunT7+T8NGK0ORRKj+HT8naZzLSIQoOSIIM3oyaJljgLxFi0xImI5oZkAWEFARSA==" crossOrigin="anonymous" referrerPolicy="no-referrer" ></link>
      </head>
      
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header></Header>
        <main>
        {children}
        </main>

        <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js" async></script>
        <script src="https://code.jquery.com/jquery-3.7.1.min.js" async></script>
        <script src="//cdn.jsdelivr.net/npm/sweetalert2@11" async></script>
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/js/selectize.min.js"
          integrity="sha512-IOebNkvA/HZjMM7MxL0NYeLYEalloZ8ckak+NDtOViP7oiYzG5vn6WVXyrJDiJPhl4yRdmNAG49iuLmhkUdVsQ=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          
        ></script>

        {/* <script src="http://localhost:8000/static/js/getCookie.js" async></script>
        <script src="http://localhost:8000/static/js/api.js" async></script> */}
        {/* <script src="http://localhost:8000/static/js/utils.js" async></script> */}
        {/* <script src="http://localhost:8000/static/js/intlTel.js" async></script> */}
        {/* <script src="http://localhost:8000/static/js/imagenesInput.js" async></script>
        
        <script src="http://localhost:8000/static/js/abonar.js" async></script> */}
        {/* <script src="http://localhost:8000/static/js/tablaArticulos.js" async></script> */}
        {/* <script src="http://localhost:8000/static/js/selectizeElements.js" async></script> */}
        {/* <script src="http://localhost:8000/static/js/selectwithImage.js" async></script> */}
        {/* <script src="http://localhost:8000/static/js/ventas.js" async></script> */}

      </body>
    </html>
  );
}
