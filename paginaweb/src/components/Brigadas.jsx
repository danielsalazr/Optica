import React from "react";
import lentes from "@brigadas/lentes.jpg";
import atencion from "@brigadas/brigada.jpg";

function Brigadas() {
  return (
    <div className="Brigadas">
      <div className="Brigadas__container">
        <h1 className="display-6 mb-3">
          <strong>Brigadas Empresariales</strong>
        </h1>

        <p>
          Nuestro objetivo principal es contribuir y acompañar en el bienestar
          visual de los colaboradores a través de la evaluación que nuestro
          profesional hace en las brigadas de apoyo empresarial. Aportando así
          al cumplimiento de las normas que requiere el programa en prevención
          visual empresarial (Resolución 111 de 2017)
        </p>

        <h3 className="display-6 mt-3">
          <strong>Beneficios</strong>
        </h3>
        <ul className="p-4">
          <li>
            Mediante el convenio empresarial el examen de optometría no tiene
            costo
          </li>
          <li>
            Traslado de optómetra y equipos al lugar acordado para el desarrollo
            de la brigada
          </li>
          <li>Variedad de monturas en diseños y materiales</li>
          <li>Gafas de seguridad industrial</li>
          <li>Manejamos convenio por descuento de nomina</li>
          <li>
            Precios especiales para el colaborador y cobertura a su núcleo
            familiar con iguales beneficios.
          </li>
          <li>Asesoramiento y acompañamiento en adaptación de lentes</li>
        </ul>

        <div className="Brigadas__images d-flex gap-5 flex-col flex-md-row justify-content-evenly">
          <figure>
            <img src={lentes} alt="" className="rounded-2" />
          </figure>
          <figure>
            <img src={atencion} alt="" className="rounded-2" />
          </figure>
        </div>

        <h3 className=" display-6 mt-3 mb-3">
          <strong>Beneficios Colaboradores</strong>
        </h3>
        <ol className="Brigadas__beneficios--adicionales">
          
            <ol type="A">
              {/* <li>Enfermedades y Afecciones visuales</li>
              <li>Tipos de lentes y sus protecciones</li> */}
              <li>
                  Charlas de promoción y prevención.
              </li>
              <li>Pausas activas visuales y cuidado de lentes</li>
              <li>Descuentos por nomina</li>
              <li>
                Plan familia.
              </li>
            </ol>
          
        
        </ol>
      </div>

      <div className="d-flex flex-col align-items-center container mt-3 mb-4">
        <h3 className="display-6" style={{"textAlign" : "center"}}><strong >Contactanos a nuestra linea empresarial </strong></h3>
      
        {/* <p className="mt-3 fs-4" style={{"textAlign" : "center"}}>
        Escribenos o llamanos ya!!, solo haz click a continuacion. 👇
        <br />Ten presente que te atenderemos con la mayor inmediatez segun nuestros horarios de atencion.</p> */}
        <p className="mt-3 fs-4" style={{"textAlign" : "center"}}>
        Haciendo click a continuacion. 👇
        </p>

        <div className="d-flex gap-5 mt-4 flex-col flex-md-row align-items-center ">
          <a href="tel:+573024800367"><button className=" border flex px-5 py-2 align-items-center gap-3 rounded-3 " style={{"fontSize" : "1.5rem", "backgroundColor": "#104baf", "color" : "#fff"}}>Linea Movil 
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="m20.487 17.14-4.065-3.696a1.001 1.001 0 0 0-1.391.043l-2.393 2.461c-.576-.11-1.734-.471-2.926-1.66-1.192-1.193-1.553-2.354-1.66-2.926l2.459-2.394a1 1 0 0 0 .043-1.391L6.859 3.513a1 1 0 0 0-1.391-.087l-2.17 1.861a1 1 0 0 0-.29.649c-.015.25-.301 6.172 4.291 10.766C11.305 20.707 16.323 21 17.705 21c.202 0 .326-.006.359-.008a.992.992 0 0 0 .648-.291l1.86-2.171a.997.997 0 0 0-.085-1.39z"></path>
                </svg></button></a>
          <a 
            href="https://wa.me/573024800367?text=Hola,%20Me%20Gustaria%20Consultar%20acerca%20de%20las%20brigadas%20empresariales🤓✏️."
            target="_blank"
          >
          <button className=" border flex px-5 py-2 align-items-center gap-3 rounded-3 " style={{"fontSize" : "1.5rem", "backgroundColor": "#2FC613", "color" : "#fff"}}>Whatsapp  
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="48"
                  height="48"
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
                </svg></button></a>
        </div>
      
      </div>
    </div>
  );
}

export default Brigadas;
