import React,{ useState } from 'react'

import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';

type SideActionProps = {
    children: React.ReactNode;
    title: React.ReactNode;
    show: boolean;
    togglestate: () => void;
    data: unknown;
    [key: string]: unknown;
};

function SideAction(props: SideActionProps) {
    const {children, title, show, togglestate, data}  = props;

    // console.log(data)

    return (
      <>
        <Offcanvas show={show} onHide={togglestate} {...props}>
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
