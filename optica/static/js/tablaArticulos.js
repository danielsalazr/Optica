async function addRow() {
  const table = document.querySelector("table tbody");
  const row = document.createElement("tr");

  const numeroFila = table.rows.length;

  const articulos = await callApi("articulos/");
  console.log(articulos);
  row.innerHTML = `
        <td class="bg-secondary-subtle">${table.rows.length + 1}</td>
        <td class="p-1" style="width: 25%">
            <select class="form-select border-0" id="articulo${numeroFila}" name="numero_articulo" id="articulo${numeroFila? numeroFila + 1 : 1}">
                <option value="">Seleccione</option>
                ${articulos.data.articulos.map(
                  (item) => `
                    
                    <option value="${item.id}" >${item.nombre}</option>

                `
                )}
            </select>
        </td>
        <td id="imageArticulo${numeroFila}"></td>
        <td class="p-1"><input type="number" class="form-control " id="cantidadArticulo${numeroFila}" name="cantidad" placeholder="Cantidad" value="1" disabled></td>
        <td><input type="text" class="form-control precio" id="precioArticulo${numeroFila}" name="precioArticulo" placeholder="Precio" step="1000"></td>
        <td>
            <select class="form-select" id="tipoDescuentoArticulo${numeroFila}" name="indicador_impuestos">
                <option value="">Seleccione</option>
                <option value="porcentaje">porcentaje %</option>
                <option value="precio" selected>precio $</option>
            </select>
        </td>
        <td class="p-1">
              <input
                type="text"
                class="form-control border-0"
                id="descuentoArticulo${numeroFila}"
                name="descuento"
                placeholder="% Descuento"
                
              />
            </td>
        
        
        <td><input type="text" class="form-control" id="totalArticulo${numeroFila}"  name="totalArticulo" placeholder="Total" value="0" readonly></td>
        
    `;
  table.appendChild(row);


  
  
  const precioArticuloTable = $(`#precioArticulo${numeroFila}`);
  const cantidadArticuloTable = $(`#cantidadArticulo${numeroFila}`);
  const descuentoArticuloTable = $(`#descuentoArticulo${numeroFila}`);
  const totalArticuloTable = $(`#totalArticulo${numeroFila}`);
  const tipoDescuentoArticuloTable = $(`#tipoDescuentoArticulo${numeroFila}`);


  precioArticuloTable.on('input', function () {
    precioArticuloTable.val(formatMoneyInput(precioArticuloTable.val())) 
  })

  
  descuentoArticuloTable.on("input", function() {
      // console.log("ejecutado")
      descuentoArticuloTable.val(separadorDeMiles(descuentoArticuloTable.val()));
  });


  /*
  precioArticuloTable.on('change', function () {
    precioArticuloTable.val(fromTextToMoney(precioArticuloTable.val())) 
  })
  */

  const selectorArticuloRow = $(`#articulo${numeroFila}`).selectize({
    onChange: async function(value) {

      if (value != ''){
        const data = await obtenerInfoArticulo(value);

        console.log(data);

        precioArticuloTable.val(moneyformat(data.precio))
        cantidadArticuloTable.prop('disabled', false);
        calculateTotalArticleTable()
      } else{
        cantidadArticuloTable.prop('disabled', true);
      }
    }
  })

  

  async function calculateTotalArticleTable() {

    // console.log("totalizado")

    const precio = precioArticuloTable.val();

    if (tipoDescuentoArticuloTable.val() != "porcentaje"){
    totalArticuloTable.val(moneyformat(precio.replace(/\D/g, "") * cantidadArticuloTable.val() - descuentoArticuloTable.val().replace(/\D/g, "")))
    } else {
      totalArticuloTable.val(moneyformat(precio.replace(/\D/g, "") * cantidadArticuloTable.val() - (precio.replace(/\D/g, "") * cantidadArticuloTable.val() * descuentoArticuloTable.val().replace(/\D/g, "")/100)))
    }

    calcularTotales()
  }


  $(`#descuentoArticulo${numeroFila}, #precioArticulo${numeroFila}, #cantidadArticulo${numeroFila}`).on('change', async function() {
    // console.log("A totalizar")
    await calculateTotalArticleTable()
    calcularTotales()
  });

  //$('.selectize-dropdown-content').style.width = '100%';
}
