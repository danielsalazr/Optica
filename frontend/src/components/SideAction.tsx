import React,{ useState } from 'react'

import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';

function SideAction(props) {
    const {children, title, show, toggleState, data}  = props;

    console.log(data)

    return (
      <>
        <Offcanvas show={show} onHide={toggleState} {...props}>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{title}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {children}
            {/* Some text as placeholder. In real life you can have the elements you
            have chosen. Like, text, images, lists, etc. */}
          </Offcanvas.Body>
        </Offcanvas>
      </>
    );
}

export default SideAction;
