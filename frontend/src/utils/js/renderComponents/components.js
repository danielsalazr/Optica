const container_fields = document.querySelector('.inventory_fields');

async function renderSelectorWarehouseField(){

    const data = await callApi(`inventory/warehousesInformation/`);
    
    console.log(data);

    const selector = warehouseSelector(data);
    container_fields.firstElementChild.insertAdjacentHTML('beforebegin', selector);

}


//container.insertAdjacentHTML('beforebegin', component);
