const escpos = require('escpos');
escpos.USB.findPrinter();

// Configura el dispositivo USB
const device = new escpos.USB();

// Configura la impresora
const printer = new escpos.Printer(device);

// Enviar comandos a la impresora
device.open(() => {
  printer
    .align('ct') // Centrar texto
    .text('Hola Mundo!') // Texto
    .cut() // Cortar papel
    .close(); // Cerrar conexión
});