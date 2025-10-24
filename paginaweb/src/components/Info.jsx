import React from "react";
import info1 from "@info/cansancioVisual.jpg";
import claridadvision3 from "@info/claridadvision3.jpg";
import visionlargoplazo from "@info/visionlargoplazo.jpg";

function Info() {
  return (
    <>
      <div
        id="carouselExampleInterval"
        class="carousel slide"
        data-bs-ride="carousel">
        <div class="carousel-inner">
          <div class="carousel-item active" data-bs-interval="10000">
            <div class="container col-xxl-8 px-4 py-5">
              <div class="row flex-col flex-md-row align-items-center  py-2">
                <div class="col-md-6 h-100 d-flex align-items-stretch flex-grow-1">
                  <img
                    src={info1}
                    class="d-block mx-lg-auto img-fluid rounded-2"
                    alt="Bootstrap Themes"
                    // width="700"
                    // height="500"
                    loading="lazy"
                  />
                </div>
                <div class="col-lg-6 ">
                  <h1 class="display-6 fw-bold text-body-emphasis lh-1 mb-3 mt-3 mt-lg-0">
                    Cansancio en la vista
                  </h1>
                  <p class="lead">
                    En un mundo cada vez mas digitalizado, nuestros ojos
                    trabajan mas que nunca. El uso costante de dispositivos,
                    largas horas frente a pantallas y el ambiente pueden
                    provocar fatiga en la vision y esto se puede manifestar como
                    sequeda, enrojecimiento, dolor de cabeaza e incluso vision
                    borrosa.
                    <br />
                    <br />
                    Al utilizar lentes para descansar la vista, no solo alivias
                    la fatiga ocular, sino que también proteges tus ojos a largo
                    plazo. No comprometas tu confort visual ni tu bienestar; haz
                    que el cuidado de tus ojos sea una prioridad. .
                  </p>
                  {/* <div class="d-grid gap-2 d-md-flex justify-content-md-start">
                                    <button type="button" class="btn btn-primary btn-lg px-4 me-md-2">Primary</button>
                                    <button type="button" class="btn btn-outline-secondary btn-lg px-4">Default</button>
                                </div> */}
                </div>
              </div>
            </div>
          </div>

          <div class="carousel-item" data-bs-interval="2000">
            <div class="container col-xxl-8 px-4 py-2">
              <div class="row flex-col flex-md-row-reverse align-items-center py-2 ">
                <div class="col-10 col-sm-8 col-lg-6 h-100 d-flex align-items-stretch">
                  <img
                    src={claridadvision3}
                    class="d-block mx-lg-auto img-fluid rounded-2"
                    alt="Bootstrap Themes"
                    width="700"
                    height="500"
                    loading="lazy"
                  />
                </div>
                <div class="col-lg-6">
                  <h1 class="display-6 fw-bold text-body-emphasis lh-1 mb-3 mt-3 mt-lg-0">
                    Recupera la claridad de tu vision
                  </h1>
                  <p class="lead">
                    La visión borrosa puede ser causada por problemas como la
                    miopía, hipermetropía, el astigmatismo, o condiciones serias
                    como el glaucoma o la catarata. Bien sea que experimentes
                    borrosidad ocasional sabemos lo frustrante que puede ser y
                    como afecta tus actividades diarias.
                    <br />
                    <br />
                    En Bienestar Optica, nos especializamos en proporcionar
                    soluciones personalizadas para que recuperes tu claridad
                    visual. ¡No dejes que la visión borrosa limite tu vida!
                    Programa una cita con nosotros hoy mismo (boton para
                    programar cita).
                  </p>
                  {/* <div class="d-grid gap-2 d-md-flex justify-content-md-start">
                                    <button type="button" class="btn btn-primary btn-lg px-4 me-md-2">Primary</button>
                                    <button type="button" class="btn btn-outline-secondary btn-lg px-4">Default</button>
                                </div> */}
                </div>
              </div>
            </div>
          </div>

          <div class="carousel-item">
            <div class="container col-xxl-8 px-4 py-2">
              <div class="row flex-col flex-md-row align-items-center  py-2 ">
                <div class="col-10 col-sm-8 col-lg-6 h-100 d-flex align-items-stretch">
                  <img
                    src={visionlargoplazo}
                    class="d-block mx-lg-auto img-fluid rounded-2"
                    alt="Bootstrap Themes"
                    width="700"
                    height="500"
                    loading="lazy"
                  />
                </div>
                <div class="col-lg-6">
                  <h1 class="display-6 fw-bold text-body-emphasis lh-1 mb-3 mt-3 mt-lg-0">
                    Conserva tu vision a largo plazo
                  </h1>
                  <p class="lead">
                    Con el pasar de los años, es natural que nuestra visión
                    cambie. Sin embargo, esto no significa que debamos
                    resignarnos a una visión borrosa ni deteriorada. En
                    Bienestar Optica, sabemos la importancia de mantener una
                    visión clara y nítida en cada etapa de la vida. por eso
                    ofrecemos una amplia selección de gafas para preservar tu
                    visión y mejorar tu calidad de vida.
                    <br />
                    <br />
                    Al utilizar lentes para descansar la vista, no solo alivias
                    la fatiga, sino que también proteges tus ojos a largo plazo.
                    No comprometas tu calidad visual ni tu bienestar; haz que el
                    cuidado de tus ojos sea una prioridad.
                  </p>
                  {/* <div class="d-grid gap-2 d-md-flex justify-content-md-start">
                                    <button type="button" class="btn btn-primary btn-lg px-4 me-md-2">Primary</button>
                                    <button type="button" class="btn btn-outline-secondary btn-lg px-4">Default</button>
                                </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          class="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleInterval"
          data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous</span>
        </button>
        <button
          class="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleInterval"
          data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next</span>
        </button>
        <hr />
      </div>

      {/* 
        <div class="container col-xxl-8 px-4 py-2">
            <div class="row flex-lg-row-reverse align-items-center g-5 py-2">
                <div class="col-10 col-sm-8 col-lg-6">
                    <img src={info1} class="d-block mx-lg-auto img-fluid" alt="Bootstrap Themes" width="700" height="500" loading="lazy" />
                </div>
                <div class="col-lg-6">
                    <h1 class="display-5 fw-bold text-body-emphasis lh-1 mb-3">Responsive left-aligned hero with image</h1>
                    <p class="lead">Quickly design and customize responsive mobile-first sites with Bootstrap, the world’s most popular front-end open source toolkit, featuring Sass variables and mixins, responsive grid system, extensive prebuilt components, and powerful JavaScript plugins.</p>
                    <div class="d-grid gap-2 d-md-flex justify-content-md-start">
                    <button type="button" class="btn btn-primary btn-lg px-4 me-md-2">Primary</button>
                    <button type="button" class="btn btn-outline-secondary btn-lg px-4">Default</button>
                    </div>
                </div>
            </div>
        </div> */}
    </>
  );
}

export default Info;
