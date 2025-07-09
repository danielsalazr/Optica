const selected = document.querySelector('.selectedPayment');
const dropdown = document.querySelector('.dropdown');
const optionPayments = document.querySelectorAll('.optionPayment');
const hiddenInput = document.querySelector('#metodoPago');
const errorMessage = document.querySelector('.error-message');

// Mostrar/Ocultar el dropdown
selected.addEventListener('click', () => {
    dropdown.classList.toggle('show');
});

// Seleccionar una opción
optionPayments.forEach(optionPayment => {
    optionPayment.addEventListener('click', () => {
        const value = optionPayment.getAttribute('data-value');
        const text = optionPayment.textContent.trim();
        const imgSrc = optionPayment.querySelector('img').src;

        // Actualizar el seleccionado
        selected.querySelector('span').textContent = text;
        selected.querySelector('img').src = imgSrc;
        hiddenInput.value = value;

        // Ocultar el dropdown
        dropdown.classList.remove('show');

        // Ocultar mensaje de error
        errorMessage.style.display = 'none';
    });
});a

// Validación del formulario
// document.querySelector('form').addEventListener('submit', (e) => {

// })

// Cerrar el dropdown si se hace clic fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
        dropdown.classList.remove('show');
    }
})


/* ------------------------------- */

export function initializeSelectWithImage() {
    const observer = new MutationObserver(() => {
        const selected = document.querySelector('.selectedPayment');
        const dropdown = document.querySelector('.dropdown');
        const optionPayments = document.querySelectorAll('.optionPayment');
        const hiddenInput = document.querySelector('#metodoPago');
        const errorMessage = document.querySelector('.error-message');

        if (!selected || !dropdown || optionPayments.length === 0 || !hiddenInput || !errorMessage) {
            return;
        }

        // Evita múltiples inicializaciones
        if (selected.dataset.initialized) return;
        selected.dataset.initialized = "true";

        // Mostrar/Ocultar el dropdown
        selected.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        // Seleccionar una opción
        optionPayments.forEach(optionPayment => {
            optionPayment.addEventListener('click', () => {
                const value = optionPayment.getAttribute('data-value');
                const text = optionPayment.textContent.trim();
                const imgSrc = optionPayment.querySelector('img').src;

                // Actualizar el seleccionado
                selected.querySelector('span').textContent = text;
                selected.querySelector('img').src = imgSrc;
                hiddenInput.value = value;

                // Ocultar el dropdown
                dropdown.classList.remove('show');

                // Ocultar mensaje de error
                errorMessage.style.display = 'none';
            });
        });

        // Cerrar el dropdown si se hace clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                dropdown.classList.remove('show');
            }
        });

        console.log("✅ Select con imágenes inicializado correctamente.");
        observer.disconnect(); // Detener la observación después de encontrar los elementos
    });

    // Iniciar la observación en el body
    observer.observe(document.body, { childList: true, subtree: true });
}


// export {initializeSelectWithImage}