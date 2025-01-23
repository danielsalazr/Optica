/*  Mudulo Api.js
Se crea coon la finalidad de modularizar las solicitudes fetch syncronas
debido a que el uso de fetch consume una alta cantidad de espacio que 
dificulta la lectura del codigo y por consiguiente el mantenimiento.

Este modulo se encargara de hacer las solicitudes Http   */

/* se obtiene csrftoken del modulo getCookie.js */
const csrftoken = getCookie('csrftoken');

/* Aqui se define la URL del proyecto*/
const URL = window.location.href
wl = URL.split("/");
// const Url = wl[0]+"//"+wl[2]+"/"+wl[3]+"/";
const BASE_URL = `${wl[0]}//${wl[2]}/`
console.log(BASE_URL);


async function callApi(endPoint, options = {}) {
    options.headers = {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
        }
        //console.log(csrftoken)

    const url = BASE_URL + endPoint;
    const response = await fetch(url, options);
    const data = await response.json();
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