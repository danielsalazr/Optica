const  warehouseSelector = (data) => {
    const selector = `
    <span class="textos">Bodega: </span>
    <select class=" camposbc" id="bodega" required="" >
        <option value="">Choose...</option>
        ${data.map((data) => {
        return `<option value="${data}">${data}</option> `
        })}
    </select>
    <br>
    `;

      return selector
}



