const selected = document.querySelector('.selected');
const dropdown = document.querySelector('.dropdown');
const options = document.querySelectorAll('.option');
const hiddenInput = document.querySelector('#metodoPago');
const errorMessage = document.querySelector('.error-message');

// Mostrar/Ocultar el dropdown
selected.addEventListener('click', () => {
    dropdown.classList.toggle('show');
});

// Seleccionar una opción
options.forEach(option => {
    option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');
        const text = option.textContent.trim();
        const imgSrc = option.querySelector('img').src;

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

// Validación del formulario
// document.querySelector('form').addEventListener('submit', (e) => {

// })

// Cerrar el dropdown si se hace clic fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
        dropdown.classList.remove('show');
    }
})