import React from 'react'

// import efectivo from '@metodospago/efectivo.png';
// import bancolombia from '@metodospago/bancolombia.png';
// import mastercard from '@metodospago/mastercard.png';
// import visa from '@metodospago/visa.png';
// import nequi from '@metodospago/nequi.png';
// import addi from '@metodospago/addi.png';
import mediospago from '@metodospago/metodosPago.png';


function AcercaDeNosotros() {

    // const imagenes = [efectivo, bancolombia, mastercard, visa, nequi, addi]

  return (
    <div className='text-center mt-5 mb-3'>

        <h2 className='h2'>Acerca de nosotros</h2>
        
        <div className="album py-5 ">
            <div className="container">
                <div className="row row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-lg-2 g-3">

                    <div className="col d-flex align-items-stretch">      
                        <div className="card shadow-sm">
                            <div className='card-body'>
                                <h2 className='h2 card-title mt-2'>Medios de pago</h2>

                                <div className='container d-flex justify-content-start px-3'>
                                <img
                                    src={mediospago}
                                    className="ms-1"
                                    style= {{
                                    width: "100%",
                                    height: "450px",
                                    objectFit: "fill",
                                    }}
                                    width="84"
                                    height="84"
                                    role="img"
                                    aria-label="Placeholder Thumbnail"
                                    focusable="false"
                                    alt=""
                                />
                            </div>
                            </div>

                            
                        </div>  
                    </div>


                    <div className="col d-flex align-items-stretch">      
                        <div className="card shadow-sm">
                            <div className='card-body'>
                                <h2 className='h2 card-title mb-4 mt-2'>Tiempos de entrega</h2>
                                <p className='card-text fs-3 p-4'>Luego Separar tus lentes, estos se envian a fabricar y pueden tomar de 4 a 7 dias habiles en estar listos dependiendo de tu formulacion , una vez pagada la totalidad de los lentes y pasado el tiempo de fabricacion, estos estaran listos para su entrega.</p>
                            </div>
                        </div>  
                    </div>


                </div>
            </div>
        </div>
    </div>
  )
}

export default AcercaDeNosotros
