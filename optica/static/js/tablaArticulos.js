async function addRow() {
  const table = document.querySelector("table tbody");
  const row = document.createElement("tr");

  const articulos = await callApi("articulos/");
  console.log(articulos);
  row.innerHTML = `
        <td class="bg-secondary-subtle">${table.rows.length + 1}</td>
        <td>
            <select class="form-select border-0" name="numero_articulo" id="articulo${table.rows.length? table.rows.length + 1 : 1}">
                <option value="">Seleccione</option>
                ${articulos.data.articulos.map(
                  (item) => `
                    
                    <option value="${item.id}" selected>${item.nombre}</option>

                `
                )}
            </select>
        </td>
        <td><input type="number" class="form-control" name="cantidad" placeholder="Cantidad"></td>
        <td><input type="number" class="form-control" id="precioArticulo${table.rows.length}" name="precioArticulo" placeholder="Precio" step="0.01"></td>
        <td>
            <select class="form-select" name="indicador_impuestos">
                <option value="">Seleccione</option>
                <option value="porcentaje">porcentaje %</option>
                <option value="precio" selected>precio $</option>
            </select>
        </td>
        <td><input type="number" class="form-control" name="descuento" placeholder="% Descuento" step="0.01"></td>
        
        
        <td><input type="number" class="form-control" name="total" placeholder="Total" step="0.01" readonly></td>
        
    `;
  table.appendChild(row);

  

  const selectorArticulo = $(`#articulo${table.rows.length}`).selectize({
    onChange: function(value) {
      weatherWidget(value);
    }
    //maxOptions: 5,
  },
);



  //$('.selectize-dropdown-content').style.width = '100%';
}
