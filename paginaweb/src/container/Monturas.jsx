import React from "react";

import info1 from "@info/cansancioVisual.jpg";
import tr90 from "@lentes/tr90.jpg";
import acero from "@lentes/acero.png";
import acetato from "@lentes/acetato.jpg";

import LentesContainer from "../components/LentesContainer";

function Monturas() {
  return (
    <>
      <div className="container d-flex flex-column align-items-center pt-2">
        <h2 className="h2 mb-3">Monturas</h2>

        <ul className="nav nav-tabs" id="myTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className="nav-link fs-5 active"
              id="tr90-tab"
              data-bs-toggle="tab"
              data-bs-target="#tr90-tab-pane"
              type="button"
              role="tab"
              aria-controls="tr90-tab-pane"
              aria-selected="true">
              Tr 90
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link fs-5"
              id="acero-tab"
              data-bs-toggle="tab"
              data-bs-target="#acero-tab-pane"
              type="button"
              role="tab"
              aria-controls="acero-tab-pane"
              aria-selected="false">
              Acero
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link fs-5"
              id="acetato-tab"
              data-bs-toggle="tab"
              data-bs-target="#acetato-tab-pane"
              type="button"
              role="tab"
              aria-controls="acetato-tab-pane"
              aria-selected="false">
              Acetato
            </button>
          </li>
        </ul>

        <div className="tab-content" id="myTabContent">
          <div
            className="tab-pane fade container show active "
            id="tr90-tab-pane"
            role="tabpanel"
            aria-labelledby="tr90-tab"
            tabindex="0">
            <LentesContainer
              text="<strong class='mt-3' style='width: 100%; display: inline-block; text-align: center;'>La combinación perfecta de resistencia y ligereza.</strong> <br> <br> Estas monturas son increíblemente duraderas y flexibles, lo que las hace ideales para un estilo de vida activo. Con su peso ligero y su capacidad para resistir el estrés y la tensión, las monturas TR90 te brindan una comodidad sin igual durante todo el día. Además, su diseño moderno y versátil las convierte en la elección perfecta para aquellos que buscan un equilibrio entre funcionalidad y estilo."
              image={tr90}
            />
          </div>
          <div
            className="tab-pane fade container"
            id="acero-tab-pane"
            role="tabpanel"
            aria-labelledby="acero-tab"
            tabindex="0">
            <LentesContainer
              text="<strong class='mt-3' style='width: 100%; display: inline-block; text-align: center;'>Sumérgete en el lujo y la sofisticación con nuestras monturas de acetato.</strong> <br> <br> Conocido por su durabilidad y belleza, nuestras monturas de acetato ofrecen una sensación de lujo y estilo atemporal. Con una amplia gama de colores y patrones disponibles, puedes encontrar la montura perfecta para expresar tu estilo único y personalidad. Además, el acetato es extremadamente moldeable, lo que permite una amplia variedad de diseños y estilos para adaptarse a tus preferencias estéticas."
              image={acero}
            />
          </div>
          <div
            className="tab-pane fade container"
            id="acetato-tab-pane"
            role="tabpanel"
            aria-labelledby="acetato-tab"
            tabindex="0">
            <LentesContainer
              text="<strong class='mt-3' style='width: 100%; display: inline-block; text-align: center;'>Experimenta la elegancia y la resistencia.</strong><br> <br> Estas monturas son conocidas por su durabilidad, resistencia a la corrosión y ligereza. Perfectas para aquellos que buscan un estilo clásico y refinado, nuestras monturas de acero ofrecen una combinación perfecta de funcionalidad y moda. Además, el acero es altamente ajustable, lo que garantiza un ajuste cómodo y seguro para todo tipo de caras. Con un acabado pulido y detalles elegantes, nuestras monturas de acero son una opción ideal para aquellos que buscan una apariencia sofisticada y sin complicaciones."
              image={acetato}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Monturas;
