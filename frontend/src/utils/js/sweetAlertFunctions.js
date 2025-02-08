export async function swalErr(falla) {

    const result = await Swal.fire({
        //type: 'error',
        icon: 'error',
        title: 'Error',
        text: falla,
    });
}

async function swalQuestion(title, text) {
    const { value: confirmation } = await Swal.fire({
        title: title,
        text: text,
        // icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0f362d', //'#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar!'
    })

    if (!confirmation) {
        return false
    }

    return true
}

export async function swalconfirmation(text) {
    Swal.fire(
        'Completado!',
        text,
        'success'
    );
    // setTimeout(() => { document.location.reload(true) }, 1500);
}

export async function swalconfirmationAndReload(text) {
    Swal.fire(
        'Completado!',
        text,
        'success'
    );
    setTimeout(() => { document.location.reload(true) }, 2000);
}

export async function swalInput(titulo) {
    const result = await Swal.fire({
        title: titulo,
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Ingresar',
        showLoaderOnConfirm: true,
        preConfirm: (login) => {
            return login;
        },
        allowOutsideClick: () => !Swal.isLoading()
    })
    return result.value


}

export async function swalHtmlCreation(text) {
    Swal.fire({
        title: '<strong>Factura Creada!</strong>',
        icon: 'success',
        html: text,
        showCloseButton: false,
        showCancelButton: false,
        focusConfirm: false,
        confirmButtonText: '<i class="fa fa-thumbs-up"></i> OK!',
        confirmButtonAriaLabel: 'Thumbs up, great!',
        cancelButtonText: '<i class="fa fa-thumbs-down"></i>',
        cancelButtonAriaLabel: 'Thumbs down'
    }).then((result) => {

        // if (result.isConfirmed) {
        //   document.location.reload(true)
        // } else if (result.isDenied) {
        //   document.location.reload(true)
        // }

    })
}

export async function swalHtml(title, htmltext) {

    let TextError = '';

    for (let key in htmltext) {
        if (htmltext.hasOwnProperty(key)) {
            console.log(key);
            console.log(htmltext[key]) // This will print each own key in the object
            TextError += `<b>${key}: </b><span>${htmltext[key]}</span>\n`
        }
    }

    await Swal.fire({
        title: `<strong><u>${title}</u></strong>`,
        icon: 'info',
        html:
        //htmltext,
            TextError,
        showCloseButton: true,
        showCancelButton: false,
        // focusConfirm: false,
        confirmButtonText: '<i class="fa fa-thumbs-up"></i> OK!',
        confirmButtonAriaLabel: 'Thumbs up, great!',
        cancelButtonText: '<i class="fa fa-thumbs-down"></i>',
        cancelButtonAriaLabel: 'Thumbs down'
    })
}

// Swal.fire({
//   title: '<strong>HTML <u>example</u></strong>',
//   icon: 'info',
//   html:
//     'You can use <b>bold text</b>, ' +
//     '<br>' +
//     '<a href="//sweetalert2.github.io">links</a> ' +
//     'and other HTML tags',
//   showCloseButton: true,
//   showCancelButton: true,
//   focusConfirm: false,
//   confirmButtonText:
//     '<i class="fa fa-thumbs-up"></i> Great!',
//   confirmButtonAriaLabel: 'Thumbs up, great!',
//   cancelButtonText:
//     '<i class="fa fa-thumbs-down"></i>',
//   cancelButtonAriaLabel: 'Thumbs down'
// })