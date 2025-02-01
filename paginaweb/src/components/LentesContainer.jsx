import React from "react";

function LentesContainer(props) {
  return (
    // <div className="container  py-2">
    <div className="flex flex-col flex-lg-row-reverse align-items-center gap-4 py-2">
      <div className=" flex-grow-1 ">
        {/* col-10 col-sm-8 col-lg-6 */}
        <img
          src={props.image}
          className="d-block mx-lg-auto img-fluid"
          alt="Bootstrap Themes"
          width="700"
          height="500"
          loading="lazy"
        />
      </div>

      <div className="col-lg-6 flex-grow-1 ">
        <p
          clasName="lead card-text text-justify "
          dangerouslySetInnerHTML={{ __html: props.text }}
        />
      </div>
    </div>
    // </div>
  );
}

export default LentesContainer;
