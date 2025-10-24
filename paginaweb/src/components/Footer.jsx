import React from "react";
import logoOptica from "@logos/bienestar_optica.png";

function Footer() {
  return (
    <div className="w-100 border-top mt-5" style={{ background: "#104BAF" }}>
      <div className="container-xxl" style={{ background: "#104BAF" }}>
        <footer className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 pt-5 ">
          <div className="col d-flex flex-column align-items-center mb-3 ">
            <a
              href="/"
              className="d-flex align-items-center justify-content-center accordion-body mb-3 link-body-emphasis text-decoration-none">
              {/* <svg className="bi me-2" ></svg> */}
              <img
                className="bi me-2"
                width="200"
                height="200"
                src={logoOptica}
                alt=""
              />
            </a>
            <p className="text-light fs-5">© 2024</p>
            <br />
            {/* <iframe 
                    src="" 
                    width="300" 
                    height="200" 
                    // style={{"border":"0"}} 
                    allowfullscreen="" 
                    loading="lazy" /> */}
            {/* <iframe
                    src=""
                    width="300"
                    height="200"
                    allowfullscreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    
                    
                /> */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d997.4545800857873!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e30a90035361613%3A0xef9bf559e1b9a993!2sBienestar%20Optica!5e0!3m2!1ses!2sco!4v1718052704355!5m2!1ses!2sco"
              width="270"
              height="200"
              className="ps-3"
              // style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>

          {/* <div className="col mb-3">

            </div> */}

          <div className="col d-flex flex-column align-items-center mb-3">
            <h5 className="fs-2 text-light mb-3">Nosotros</h5>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-light">
                  Nosotros
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-light">
                  Promociones
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-light">
                  Garantia y recomendaciones
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-light">
                  Charlas empresariales
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-light">
                  Quienes somos
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link p-0 text-light">
                  Politicas de devolucion y canceclacion
                </a>
              </li>
            </ul>
          </div>

          <div className="col mb-3 d-flex flex-column align-items-center mt-3 mt-md-0">
            <h5 className="fs-2 text-light mb-3 ">Contacto</h5>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <h5 className="nav-link p-0 fs-4 text-light mb-2">
                  Horario de atencion:
                </h5>
                <p className="nav-link p-0 text-light">
                  Lunes a viernes: 9AM - 12PM
                  <br />
                  1:30PM - 6:30PM
                  <br />
                  Sabados: 8:30Am - 2:30PM
                </p>
              </li>
              <li className="nav-item mb-2">
                <h5 className="nav-link p-0 fs-4 text-light mb-2">
                  Contactanos:
                </h5>

                <a
                  href="tel:+573187561414"
                  target="_blank"
                  class="nav-link px-0 text-white flex gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24">
                    <path
                      fill="#fff"
                      d="m20.487 17.14-4.065-3.696a1.001 1.001 0 0 0-1.391.043l-2.393 2.461c-.576-.11-1.734-.471-2.926-1.66-1.192-1.193-1.553-2.354-1.66-2.926l2.459-2.394a1 1 0 0 0 .043-1.391L6.859 3.513a1 1 0 0 0-1.391-.087l-2.17 1.861a1 1 0 0 0-.29.649c-.015.25-.301 6.172 4.291 10.766C11.305 20.707 16.323 21 17.705 21c.202 0 .326-.006.359-.008a.992.992 0 0 0 .648-.291l1.86-2.171a.997.997 0 0 0-.085-1.39z"></path>
                  </svg>
                  +57 318 756 1414
                </a>
                <a
                  href="https://wa.me/573187561414?text=Me%20Gustaria%20separar%20una%20cita%20con%20ustedes"
                  target="_blank"
                  class="nav-link px-0 text-white flex gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="24"
                    height="24"
                    viewBox="0 0 48 48">
                    <path
                      fill="#fff"
                      d="M4.9,43.3l2.7-9.8C5.9,30.6,5,27.3,5,24C5,13.5,13.5,5,24,5c5.1,0,9.8,2,13.4,5.6	C41,14.2,43,18.9,43,24c0,10.5-8.5,19-19,19c0,0,0,0,0,0h0c-3.2,0-6.3-0.8-9.1-2.3L4.9,43.3z"></path>
                    <path
                      fill="#fff"
                      d="M4.9,43.8c-0.1,0-0.3-0.1-0.4-0.1c-0.1-0.1-0.2-0.3-0.1-0.5L7,33.5c-1.6-2.9-2.5-6.2-2.5-9.6	C4.5,13.2,13.3,4.5,24,4.5c5.2,0,10.1,2,13.8,5.7c3.7,3.7,5.7,8.6,5.7,13.8c0,10.7-8.7,19.5-19.5,19.5c-3.2,0-6.3-0.8-9.1-2.3	L5,43.8C5,43.8,4.9,43.8,4.9,43.8z"></path>
                    <path
                      fill="#cfd8dc"
                      d="M24,5c5.1,0,9.8,2,13.4,5.6C41,14.2,43,18.9,43,24c0,10.5-8.5,19-19,19h0c-3.2,0-6.3-0.8-9.1-2.3	L4.9,43.3l2.7-9.8C5.9,30.6,5,27.3,5,24C5,13.5,13.5,5,24,5 M24,43L24,43L24,43 M24,43L24,43L24,43 M24,4L24,4C13,4,4,13,4,24	c0,3.4,0.8,6.7,2.5,9.6L3.9,43c-0.1,0.3,0,0.7,0.3,1c0.2,0.2,0.4,0.3,0.7,0.3c0.1,0,0.2,0,0.3,0l9.7-2.5c2.8,1.5,6,2.2,9.2,2.2	c11,0,20-9,20-20c0-5.3-2.1-10.4-5.8-14.1C34.4,6.1,29.4,4,24,4L24,4z"></path>
                    <path
                      fill="#40c351"
                      d="M35.2,12.8c-3-3-6.9-4.6-11.2-4.6C15.3,8.2,8.2,15.3,8.2,24c0,3,0.8,5.9,2.4,8.4L11,33l-1.6,5.8	l6-1.6l0.6,0.3c2.4,1.4,5.2,2.2,8,2.2h0c8.7,0,15.8-7.1,15.8-15.8C39.8,19.8,38.2,15.8,35.2,12.8z"></path>
                    <path
                      fill="#fff"
                      fill-rule="evenodd"
                      d="M19.3,16c-0.4-0.8-0.7-0.8-1.1-0.8c-0.3,0-0.6,0-0.9,0	s-0.8,0.1-1.3,0.6c-0.4,0.5-1.7,1.6-1.7,4s1.7,4.6,1.9,4.9s3.3,5.3,8.1,7.2c4,1.6,4.8,1.3,5.7,1.2c0.9-0.1,2.8-1.1,3.2-2.3	c0.4-1.1,0.4-2.1,0.3-2.3c-0.1-0.2-0.4-0.3-0.9-0.6s-2.8-1.4-3.2-1.5c-0.4-0.2-0.8-0.2-1.1,0.2c-0.3,0.5-1.2,1.5-1.5,1.9	c-0.3,0.3-0.6,0.4-1,0.1c-0.5-0.2-2-0.7-3.8-2.4c-1.4-1.3-2.4-2.8-2.6-3.3c-0.3-0.5,0-0.7,0.2-1c0.2-0.2,0.5-0.6,0.7-0.8	c0.2-0.3,0.3-0.5,0.5-0.8c0.2-0.3,0.1-0.6,0-0.8C20.6,19.3,19.7,17,19.3,16z"
                      clip-rule="evenodd"></path>
                  </svg>
                  +57 318 756 1414
                </a>
                <a
                  href="mailto:Bieneropticaempresarial@gmail.com?subject=Separar cita examen visual&body=Me gustaria separar una cita para examen visual con ustedes&cc=daniel.salazar@hotmail.com&bcc=giovanna-0126@hotmail.com"
                  target="_blank"
                  class="nav-link px-0 text-white flex gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24">
                    <path
                      fill="#fff"
                      d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.7-8 5.334L4 8.7V6.297l8 5.333 8-5.333V8.7z"></path>
                  </svg>
                  Bienestaropticaempresarial@gmail.com
                </a>
              </li>
              {/* <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-light">Pricing</a></li>
                <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-light">FAQs</a></li>
                <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-light">About</a></li> */}
            </ul>
          </div>

          <div className="col mb-5 d-flex flex-column align-items-center mt-3 mt-md-0">
            <h5 className="fs-2 text-light mb-3">Siguenos</h5>
            <ul className="nav flex-column ">
              <li className="nav-item mb-2">
                <a
                  href="https://www.instagram.com/bienestaropticacali/"
                  target="_blank"
                  className="nav-link px-0 text-white flex gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="28"
                    height="28"
                    viewBox="0 0 48 48">
                    <radialGradient
                      id="yOrnnhliCrdS2gy~4tD8ma_Xy10Jcu1L2Su_gr1"
                      cx="19.38"
                      cy="42.035"
                      r="44.899"
                      gradientUnits="userSpaceOnUse">
                      <stop offset="0" stop-color="#fd5"></stop>
                      <stop offset=".328" stop-color="#ff543f"></stop>
                      <stop offset=".348" stop-color="#fc5245"></stop>
                      <stop offset=".504" stop-color="#e64771"></stop>
                      <stop offset=".643" stop-color="#d53e91"></stop>
                      <stop offset=".761" stop-color="#cc39a4"></stop>
                      <stop offset=".841" stop-color="#c837ab"></stop>
                    </radialGradient>
                    <path
                      fill="url(#yOrnnhliCrdS2gy~4tD8ma_Xy10Jcu1L2Su_gr1)"
                      d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992l-0.019-20	c-0.004-4.4,3.592-8.003,7.992-8.008l20-0.019c4.4-0.004,8.003,3.592,8.008,7.992l0.019,20	C42.014,38.383,38.417,41.986,34.017,41.99z"></path>
                    <radialGradient
                      id="yOrnnhliCrdS2gy~4tD8mb_Xy10Jcu1L2Su_gr2"
                      cx="11.786"
                      cy="5.54"
                      r="29.813"
                      gradientTransform="matrix(1 0 0 .6663 0 1.849)"
                      gradientUnits="userSpaceOnUse">
                      <stop offset="0" stop-color="#4168c9"></stop>
                      <stop
                        offset=".999"
                        stop-color="#4168c9"
                        stop-opacity="0"></stop>
                    </radialGradient>
                    <path
                      fill="url(#yOrnnhliCrdS2gy~4tD8mb_Xy10Jcu1L2Su_gr2)"
                      d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992l-0.019-20	c-0.004-4.4,3.592-8.003,7.992-8.008l20-0.019c4.4-0.004,8.003,3.592,8.008,7.992l0.019,20	C42.014,38.383,38.417,41.986,34.017,41.99z"></path>
                    <path
                      fill="#fff"
                      d="M24,31c-3.859,0-7-3.14-7-7s3.141-7,7-7s7,3.14,7,7S27.859,31,24,31z M24,19c-2.757,0-5,2.243-5,5	s2.243,5,5,5s5-2.243,5-5S26.757,19,24,19z"></path>
                    <circle cx="31.5" cy="16.5" r="1.5" fill="#fff"></circle>
                    <path
                      fill="#fff"
                      d="M30,37H18c-3.859,0-7-3.14-7-7V18c0-3.86,3.141-7,7-7h12c3.859,0,7,3.14,7,7v12	C37,33.86,33.859,37,30,37z M18,13c-2.757,0-5,2.243-5,5v12c0,2.757,2.243,5,5,5h12c2.757,0,5-2.243,5-5V18c0-2.757-2.243-5-5-5H18z"></path>
                  </svg>
                  bienestaropticacali
                </a>
              </li>

              <li className="nav-item mb-2">
                <a
                  href="https://www.facebook.com/bienestaropticacali"
                  target="_blank"
                  className="nav-link p-0 text-light flex gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="28"
                    height="28"
                    viewBox="0 0 48 48">
                    <linearGradient
                      id="Ld6sqrtcxMyckEl6xeDdMa_uLWV5A9vXIPu_gr1"
                      x1="9.993"
                      x2="40.615"
                      y1="9.993"
                      y2="40.615"
                      gradientUnits="userSpaceOnUse">
                      <stop offset="0" stop-color="#2aa4f4"></stop>
                      <stop offset="1" stop-color="#007ad9"></stop>
                    </linearGradient>
                    <path
                      fill="url(#Ld6sqrtcxMyckEl6xeDdMa_uLWV5A9vXIPu_gr1)"
                      d="M24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20S35.046,4,24,4z"></path>
                    <path
                      fill="#fff"
                      d="M26.707,29.301h5.176l0.813-5.258h-5.989v-2.874c0-2.184,0.714-4.121,2.757-4.121h3.283V12.46 c-0.577-0.078-1.797-0.248-4.102-0.248c-4.814,0-7.636,2.542-7.636,8.334v3.498H16.06v5.258h4.948v14.452 C21.988,43.9,22.981,44,24,44c0.921,0,1.82-0.084,2.707-0.204V29.301z"></path>
                  </svg>
                  Bienestar Óptica
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@bienestar_opticacali"
                  target="_blank"
                  className="nav-link px-0 text-white flex gap-1">
                  <svg
                    data-name="Layer 1"
                    id="Layer_1"
                    viewBox="0 0 512 512"
                    width="28"
                    height="28"
                    xmlns="http://www.w3.org/2000/svg">
                    <style>{`.cls-1{fill:url(#linear-gradient);}.cls-2{fill:url(#linear-gradient-2);}.cls-3{fill:url(#linear-gradient-3);}.cls-4{fill:url(#linear-gradient-4);`}</style>
                    <linearGradient
                      gradientUnits="userSpaceOnUse"
                      id="linear-gradient"
                      x1="-1.347"
                      x2="510.699"
                      y1="513.347"
                      y2="1.301">
                      <stop offset="0" stop-color="#111" />
                      <stop offset="1" stop-color="#323232" />
                    </linearGradient>
                    <linearGradient
                      gradientUnits="userSpaceOnUse"
                      id="linear-gradient-2"
                      x1="153.06"
                      x2="368.112"
                      y1="376.967"
                      y2="161.914">
                      <stop offset="0" stop-color="#b5053c" />
                      <stop offset="0.233" stop-color="#c90441" />
                      <stop offset="0.737" stop-color="#f0014b" />
                      <stop offset="1" stop-color="#ff004f" />
                    </linearGradient>
                    <linearGradient
                      gradientUnits="userSpaceOnUse"
                      id="linear-gradient-3"
                      x1="136.192"
                      x2="362.722"
                      y1="366.084"
                      y2="139.555">
                      <stop offset="0" stop-color="#00b2c9" />
                      <stop offset="0.283" stop-color="#00c8d4" />
                      <stop offset="0.741" stop-color="#00e6e4" />
                      <stop offset="1" stop-color="#00f1ea" />
                    </linearGradient>
                    <linearGradient
                      gradientUnits="userSpaceOnUse"
                      id="linear-gradient-4"
                      x1="9.279"
                      x2="510.704"
                      y1="506.873"
                      y2="5.448">
                      <stop offset="0" stop-color="#dde3e4" />
                      <stop offset="1" stop-color="#fcf7f7" />
                    </linearGradient>
                    <title />
                    <path
                      class="cls-1"
                      d="M256,0C114.615,0,0,114.615,0,256S114.615,512,256,512,512,397.385,512,256,397.385,0,256,0Z"
                    />
                    <path
                      class="cls-2"
                      d="M393.729,187.531a72.364,72.364,0,0,1-72.365-72.364h-51.7V317.615a43.964,43.964,0,1,1-31.547-42.221V225.138a93.308,93.308,0,1,0,80.839,92.477l1.5-102.332a123.5,123.5,0,0,0,73.267,23.946Z"
                    />
                    <path
                      class="cls-3"
                      d="M380.062,173.448A72.364,72.364,0,0,1,307.7,101.083H256V303.531a43.964,43.964,0,1,1-31.547-42.22V211.054a93.308,93.308,0,1,0,80.839,92.477L306.8,201.2a123.5,123.5,0,0,0,73.267,23.945Z"
                    />
                    <path
                      class="cls-4"
                      d="M380.062,186.237a72.365,72.365,0,0,1-44.615-28.176,72.346,72.346,0,0,1-26.375-42.894H269.667V317.615a44.015,44.015,0,0,1-81.653,22.815,44.018,44.018,0,0,1,36.439-79.119V224.328a93.3,93.3,0,0,0-72.236,150.841,93.3,93.3,0,0,0,153.075-71.638L306.8,201.2a123.5,123.5,0,0,0,73.267,23.945Z"
                    />
                  </svg>
                  Bienestar Optica
                </a>
              </li>
              {/* <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-light">Pricing</a></li>
                <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-light">FAQs</a></li>
                <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-light">About</a></li> */}
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Footer;
