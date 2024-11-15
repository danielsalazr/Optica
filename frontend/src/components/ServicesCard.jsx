import React from 'react'

function ServicesCard( props ) {

  return (
    <div className="col d-flex align-items-stretch ">
        <div className="card shadow-sm flex-fill">
            <img
                src={props.image}
                className="bd-placeholder-img card-img-top"
                style= {{
                width: "100%",
                height: "550px",
                objectFit: "fill",
                }}
                width="100%"
                height="550"
                role="img"
                aria-label="Placeholder Thumbnail"
                focusable="false"
                alt=""
            />
            <hr />

            <div className="card-body">
                <p className='h5' >{props.title}</p>
                <p className="card-text">{props.text}</p>
                <div className="d-flex justify-content-between align-items-center">
                {/* <div className="btn-group">
                    <button type="button" className="btn btn-sm btn-outline-secondary">View</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary">Edit</button>
                </div> */}
                {/* <small className="text-body-secondary">9 mins</small> */}
                </div>
            </div>
        </div>
    </div>
  )
}

export default ServicesCard
