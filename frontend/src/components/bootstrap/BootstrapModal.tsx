import React, { useEffect, useRef } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

type BootstrapModalProps = {
    onHide: () => void;
    title?: React.ReactNode;
    children: React.ReactElement<{ ref?: React.Ref<unknown> }>;
    onSubmit: (value: unknown) => void;
    submitBtn?: React.ReactNode;
    [key: string]: unknown;
};

export default function BootstrapModal(props: BootstrapModalProps) {
    const formRef = useRef<{ submit?: () => Promise<unknown> | unknown } | null>(null);
    const { onHide, title, children, onSubmit, submitBtn, ...modalProps } = props;
  

      const handleSubmit = async () => {
        console.log('Se activo')
        if (formRef.current) {
            console.log(formRef.current)
            const consulta = await formRef.current.submit?.();
            console.log(consulta)
            // console.log(formRef.telefono.getInstance().getNumber(telefono))
            if (consulta != false)  {
              
                onSubmit(consulta);
              onHide();
              }      
        }
    
      };

      useEffect(() => {
        console.log(formRef.current)
      },[])
  return (
    <Modal
      {...modalProps}
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
            {submitBtn}
        </button>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
