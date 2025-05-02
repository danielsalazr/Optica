import React, { useEffect, useRef, useState } from 'react';

function MedioPago(props) {

    const { data, name, className, labelInput, required, setData } = props;
    console.log(setData)
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const hiddenInputRef = useRef(null);

    const [selectedOption, setSelectedOption] = useState(
        setData ? {
            value: setData.medioDePago_id,
            text: setData.medioPago,
            imgSrc: setData.imagenMedioPago,
        }:  
        {
        
        value: '',
        text: 'Seleccione una opción',
        imgSrc: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbyC6amH2B9H4vu3pEVEms33iwwLjgS1v0iw&s',
    });

    const toggleDropdown = () => {
        if (dropdownRef.current) {
            dropdownRef.current.classList.toggle('show');
        }
    };

    const selectOption = (element) => {
        console.log(element)
        setSelectedOption({
            value: element.id,
            text: element.nombre,
            imgSrc: element.imagen,
        });

        if (hiddenInputRef.current) {
            hiddenInputRef.current.value = element.id;
        }

        if (dropdownRef.current) {
            dropdownRef.current.classList.remove('show');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                dropdownRef.current?.classList.remove('show');
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef}  className={className} >
            {labelInput && <label htmlFor="valor">{labelInput}</label>}
            <div className="custom-select">
                <div className="selectedPayment form-select" onClick={toggleDropdown}>
                    <img src={selectedOption.imgSrc} alt="Selected" />
                    <span>{selectedOption.text}</span>
                </div>
                <div ref={dropdownRef} className="dropdownSelector form-select">
                    {data.mediosPago.map((element) => (
                        <div
                            key={element.id}
                            className="optionPayment"
                            onClick={() => selectOption(element)}
                        >
                            <img src={element.imagen} alt={element.nombre} />
                            {element.nombre}
                        </div>
                    ))}
                </div>
                <input ref={hiddenInputRef} type="hidden" name={name}  required={required} />
                <div className="error-message" style={{ display: 'none' }}>
                    Este campo es obligatorio.
                </div>
            </div>
        </div>
    );
}

export default MedioPago;