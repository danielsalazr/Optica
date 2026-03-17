import React, { useEffect, useRef, useState } from 'react';

type MedioPagoOption = {
    id: string | number;
    nombre: string;
    imagen: string;
};

type MedioPagoInitialValue = {
    medioDePago_id?: string | number;
    medioPago?: string;
    imagenMedioPago?: string;
};

type MedioPagoProps = {
    data: {
        mediosPago?: MedioPagoOption[];
        [key: string]: unknown;
    } | null | undefined;
    name: string;
    className?: string;
    labelInput?: React.ReactNode;
    required?: boolean;
    setData?: MedioPagoInitialValue;
};

function MedioPago(props: MedioPagoProps) {

    const { data, name, className, labelInput, required, setData } = props;
    console.log(setData)
    const containerRef = useRef<HTMLDivElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const hiddenInputRef = useRef<HTMLInputElement | null>(null);

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

    const selectOption = (element: MedioPagoOption) => {
        console.log(element)
        setSelectedOption({
            value: element.id,
            text: element.nombre,
            imgSrc: element.imagen,
        });

        // console.log(hiddenInputRef.current)

        // if (hiddenInputRef.current) {
        //     hiddenInputRef.current.value = element.id;
        // }
        // hiddenInputRef.current.value = element.id;

        // console.log(hiddenInputRef.current.value)
        // console.log(hiddenInputRef.current)

        if (dropdownRef.current) {
            dropdownRef.current.classList.remove('show');
        }

        console.log(hiddenInputRef.current)
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (containerRef.current && target && !containerRef.current.contains(target)) {
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
                    {(data?.mediosPago ?? []).map((element) => (
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
                <input 
                    ref={hiddenInputRef}
                    type="hidden" name={name}
                    required={required}
                    // value={}
                    value={selectedOption.value}
                    // Utilizar defaultValue definitivamente no es una buena practica en next.js
                    // defaultValue={setData ? setData.medioDePago_id : ''}
                />
                <div className="error-message" style={{ display: 'none' }}>
                    Este campo es obligatorio.
                </div>
            </div>
        </div>
    );
}

export default MedioPago;
