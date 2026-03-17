import printer from "@thiagoelg/node-printer"
import EscPosEncoder from "esc-pos-encoder"

/* ===============================
   DETECTAR IMPRESORAS
================================ */

const printers = printer.getPrinters()

console.log("Impresoras detectadas:")
console.log(printers)

/* ===============================
   DETECTAR ANCHO DE PAPEL
================================ */

function detectPaperWidth(printer){

 if(!printer.options) return 80

 const sizes = printer.options.paperSizes || []

 const roll = sizes.find(s =>
   s.toLowerCase().includes("roll")
 )

 if(!roll) return 80

 const match = roll.match(/(\d+)/)

 return match ? parseInt(match[1]) : 80
}

/* ===============================
   CARACTERES POR LINEA
================================ */

function charsPerLine(width){

 if(width <= 58) return 32
 if(width <= 80) return 42
 if(width <= 112) return 56

 return 42
}

/* ===============================
   ALINEAR COLUMNAS
================================ */

function formatLine(left,right,totalWidth){

 const rightStr = String(right)

 const spaces = totalWidth - left.length - rightStr.length

 return left + " ".repeat(Math.max(1,spaces)) + rightStr
}

/* ===============================
   CENTRAR TEXTO
================================ */

function center(text,width){

 const spaces = Math.floor((width - text.length)/2)

 return " ".repeat(Math.max(0,spaces)) + text
}

/* ===============================
   GENERAR TICKET
================================ */

function generateTicket(data,width){
 const chars = charsPerLine(width)

 let ticket = ""
 ticket += center("OPTICA CENTRAL",chars) + "\n"
 ticket += center("NIT 900000000",chars) + "\n"
 ticket += "-".repeat(chars) + "\n"
 for(const item of data.items){
   ticket += formatLine(
     item.name,
     item.price,
     chars
   ) + "\n"
 }
 ticket += "-".repeat(chars) + "\n"
 ticket += formatLine("TOTAL",data.total,chars) + "\n"
 ticket += "\n\n"
 ticket += center("GRACIAS POR SU COMPRA",chars)
 return ticket
}

/* ===============================
   GENERAR TICKET ESC/POS
================================ */

function generateTicketEscPos(data,width){
 const chars = charsPerLine(width)
 const encoder = new EscPosEncoder()

 const lines = []
 lines.push(center("OPTICA CENTRAL",chars))
 lines.push(center("NIT 900000000",chars))
 lines.push("-".repeat(chars))
 for(const item of data.items){
   lines.push(formatLine(item.name, item.price, chars))
 }
 lines.push("-".repeat(chars))
 lines.push(formatLine("TOTAL",data.total,chars))

 encoder.initialize()
 encoder.align("center").bold(true).text(lines[0]).bold(false).newline()
 encoder.align("center").text(lines[1]).newline()
 encoder.align("left").text(lines[2]).newline()
 for(let i=3;i<lines.length-2;i++){
   encoder.text(lines[i]).newline()
 }
 encoder.text(lines[lines.length-2]).newline()
 encoder.bold(true).text(lines[lines.length-1]).bold(false).newline()
 encoder.newline().newline()
 encoder.align("center").text("GRACIAS POR SU COMPRA").newline()
 encoder.cut()

 return encoder.encode()
}

/* ===============================
   IMPRIMIR TICKET
================================ */

function printTicket(printerName,ticket){

 printer.printDirect({

   data: ticket,

   printer: printerName,

   type: "RAW",

   success: function(jobID){
     console.log("Ticket enviado. JobID:",jobID)
   },

   error: function(err){
     console.error("Error imprimiendo:",err)
   }

 })

}

/* ===============================
   EJECUCION
================================ */

const selectedPrinter = printers[0]

const width = detectPaperWidth(selectedPrinter)

console.log("Ancho detectado:",width,"mm")

const ticket = generateTicketEscPos({

 items:[
   {name:"LENTES",price:20000},
   {name:"ESTUCHE",price:5000},
   {name:"SOLUCION",price:12000}
 ],

 total:37000

},width)

console.log("\nTicket generado (ESC/POS bytes):", ticket.length)

printTicket(selectedPrinter.name,ticket)
