/*  Mudulo Api.js
Se crea coon la finalidad de modularizar las solicitudes fetch syncronas
debido a que el uso de fetch consume una alta cantidad de espacio que 
dificulta la lectura del codigo y por consiguiente el mantenimiento.

Este modulo se encargara de hacer las solicitudes Http   */
// import { getCookie } from '@/utils/js/getCookie.js';

function getCookie(name) {
    
    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
/* se obtiene csrftoken del modulo getCookie.js */
const csrftoken = getCookie('csrftoken');

// if (typeof document === "undefined") {
//     return null; // Si se ejecuta en SSR, no hay cookies disponibles
// }

/* Aqui se define la URL del proyecto*/
const URL = window.location.href
let wl = URL.split(/[:/]/); //("/",);
// const Url = wl[0]+"//"+wl[2]+"/"+wl[3]+"/";
const BASE_URL = `${wl[0]}://${wl[3]}:8000/`

console.log(wl);
console.log(BASE_URL);

export function IP_URL() {
    const URL2 = window.location.href
    let wl2 = URL2.split(/[:/]/); //("/");
    // const Url = wl[0]+"//"+wl[2]+"/"+wl[3]+"/";
    const BASE_URL2 = `${wl2[0]}://${wl2[3]}:8000/`
    return BASE_URL2
}



export async function callApi(endPoint, options = {}) {
    options.headers = {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
        }
        //console.log(csrftoken)

    const url = BASE_URL + endPoint;
    console.log(url);
    const response = await fetch(url, options);
    const data = await response.json();
    // console.log(data);
    // console.log(data);
    return { res: response, data: data }
}

export async function callApiForm(endPoint, formData, options = {}){
    options.headers = {
        'X-CSRFToken': csrftoken,
    };
    // console.log(options.method)
    options.method ? options.method : options.method = 'POST';
    // console.log(options.method)
    // options.method = 'POST';
    options.body = formData;
  
  
      //console.log(csrftoken)
  
    const url = BASE_URL + endPoint;
    const response =  await fetch(url, options);
    const data = await response.json();
    return {res: response, data: data}
  }


export async function callApiFile(endPoint, options = {}) {
    options.headers = {
            'X-CSRFToken': csrftoken,
            //'Content-Type': 'application/json',
        }
        //console.log(csrftoken)

    const url = BASE_URL + endPoint;
    const response = await fetch(url, options);
    const data = await response.json();
    return { res: response, data: data }
}

export async function callApiFile2(endPoint, options = {}) {
    options.headers = {
            'X-CSRFToken': csrftoken,
            //'Content-Type': 'application/json',
        }
        //console.log(csrftoken)

    const url = IP_URL() + endPoint;
    const response = await fetch(url, options);
    const data = await response.json();
    return { res: response, data: data }
}

export  {wl, BASE_URL}












const script = document.createElement("script");
// script.src = "https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js";
script.async = true;
script.onload = () => {
    const csrftoken = getCookie('csrftoken');

// if (typeof document === "undefined") {
//     return null; // Si se ejecuta en SSR, no hay cookies disponibles
// }

/* Aqui se define la URL del proyecto*/
const URL = window.location.href
let wl = URL.split(/[:/]/); //("/",);
// const Url = wl[0]+"//"+wl[2]+"/"+wl[3]+"/";
const BASE_URL = `${wl[0]}://${wl[3]}:8000/`

console.log(wl);
console.log(BASE_URL);

 function IP_URL() {
    const URL2 = window.location.href
    let wl2 = URL2.split(/[:/]/); //("/");
    // const Url = wl[0]+"//"+wl[2]+"/"+wl[3]+"/";
    const BASE_URL2 = `${wl2[0]}://${wl2[3]}:8000/`
    return BASE_URL2
}



 async function callApi(endPoint, options = {}) {
    options.headers = {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
        }
        //console.log(csrftoken)

    const url = BASE_URL + endPoint;
    console.log(url);
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
    return { res: response, data: data }
}


async function callApiFile(endPoint, options = {}) {
    options.headers = {
            'X-CSRFToken': csrftoken,
            //'Content-Type': 'application/json',
        }
        //console.log(csrftoken)

    const url = BASE_URL + endPoint;
    const response = await fetch(url, options);
    const data = await response.json();
    return { res: response, data: data }
}

// export  {wl, BASE_URL}

};
document.body.appendChild(script);