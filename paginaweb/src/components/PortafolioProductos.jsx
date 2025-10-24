import React from 'react'

function PortafolioProductos() {
  return (
    <section className='portafolioProductos'>
        <div className='portafolioProductos__container'>
            <h4>Productos y servicios</h4>
            <div className='portafolioProductos__container--cards'>
                <div className="portafolioProductos__card">
                    <h5>Consulta de Optometría</h5>
                    <p>
                        Por medio de una valoración integral de optometría, evaluando y analizando cada uno
                        de los componentes de la función visual y ocular, se genera un diagnóstico acertado que
                        permite brindar la mejor opción en corrección de defectos refractivos, tratamiento y
                        manejo de las condiciones que estén afectando el desempeño.
                    </p>

                </div>
                <div className="portafolioProductos__card">
                    <h5>Lentes Oftálmicos</h5>
                    <p>
                        Contamos con variedad en opciones de lentes oftalmológicos con el objetivo de suplir
                        las necesidades que desea cada paciente, manejamos lentes de diversos diseños,
                        optimizando la calidad y confort visual.
                        Opciones de lentes:
                        Monofocales
                        Bifocales flap top – invisibles
                        Progresivo digital gama media alta
                        Ocupacionales
                        Industriales
                    </p>
                    

                </div>
                <div className="portafolioProductos__card">
                    <h5>Monturas</h5>
                    <p>
                        Nuestra óptica cuenta con monturas de gran variedad, pensando en la diversidad de
                        gustos que maneja nuestra población, contamos con monturas en acetato y acero
                        quirúrgico.
                    </p>
                    
                </div>
                <div className="portafolioProductos__card">
                    <h5>Gafas industriales</h5>
                    <p>
                        Contamos con variedad en monturas y lentes industriales para los diferentes sectores
                        empresariales y así poder brindar la protección adecuada a los colaboradores. 
                    </p>
                    
                </div>
            </div>
            
        </div>
    </section>
  )
}

export default PortafolioProductos