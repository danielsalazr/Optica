"use client";
import  Dropdown  from "react-bootstrap/Dropdown";
import DropdownButton from 'react-bootstrap/DropdownButton';
import React from 'react'

function DropDown() {
  return (
    <DropdownButton id="dropdown-basic-button" title="Dropdown button">
        <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
        <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
        <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
    </DropdownButton>
  )
}

export default DropDown
