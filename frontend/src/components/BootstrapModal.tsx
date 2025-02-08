import React, { useEffect, useRef } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export default function BootstrapModal(props) {
    const formRef = useRef(null);
    const { onHide, title, children, onSubmit } = props;
    
    // const handleSubmit = () => {
    //     if (formRef.current) {
    //       onSubmit(formRef.current); // Llamar la función onSubmit con la referencia al formulario
    //     }
    //   };

      const handleSubmit = async () => {
        console.log('Se activo')
        if (formRef.current) {
            console.log(formRef.current)
            console.log(formRef.current.current)
            const consulta = await formRef.current.submit();
            console.log(consulta)
            if (consulta == true)  onHide();
          // const formData = new FormData(formRef.current.current); // Obtener los datos del formulario
        //   if (onSubmit) {
        //     onSubmit(formData); // Pasar los datos a la función de submit
        //   }
        }
       
        // Cerrar el modal
      };

      useEffect(() => {
        console.log(formRef.current?.current)
      },[])
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {props.title} 
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* {props.children(formRef)} */}
        {React.cloneElement(children, { ref: formRef })}
        
      </Modal.Body>
      <Modal.Footer>
        <button  className="btn btn-primary col-2" id="submitCliente" onClick={handleSubmit}>
            Crear cliente
        </button>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
