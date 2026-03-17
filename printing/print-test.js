import fs from "fs"
import PDFDocument from "pdfkit"
import ptp from "pdf-to-printer"

const printerName = "EPSON TM-T20II Receipt"

const paperSizes = [
  "A4",
  "Letter",
  "Postcard",
  "Roll Paper 58 x 297 mm"
]

async function createPDF(text,file){

 return new Promise((resolve)=>{

   const doc = new PDFDocument()

   const stream = fs.createWriteStream(file)

   doc.pipe(stream)

   doc.fontSize(20).text(text,100,100)

   doc.end()

   stream.on("finish",resolve)

 })

}

async function printTest(){

 for(const size of paperSizes){

   const file = `test-${size.replace(/ /g,"_")}.pdf`

   await createPDF(`Test tamaño: ${size}`,file)

   console.log("Imprimiendo:",size)

   await ptp.print(file,{
     printer: printerName,
     paperSize: size
   })

 }

 console.log("Pruebas enviadas")

}

printTest()