
function agregarArrayAFormData(formData, fieldName, values, useIndex = false, separator = ',') {
    if (useIndex) {
      // Agrega cada valor con un índice (ej: campo[0], campo[1], etc.)
      formData.delete(`${fieldName}`)
      values.forEach((value, index) => {
        formData.append(`${fieldName}`, value);
      });
    } else {
      // Agrega todos los valores en un solo campo, separados por el separador
      
      const joinedValues = values.join(separator);
      formData.append(`${fieldName}`, joinedValues);
    }
  }

function transformarArray(array, transformFn) {
    return array.map(transformFn);
}

export function transformarFormDataValues(formData, transformFn, values, typeArray){
    if (typeArray === 'string'){

    const extractedValues = [];
    values.forEach(element => extractedValues.push(formData.get(element)));

    const transformedValues = extractedValues.map(transformFn);

    values.forEach(element => formData.delete(element));

    values.forEach((key, index) => {
        formData.append(key, transformedValues[index]);
    });

    // transformedValues.forEach(value => console.log(value));

    return formData;

    }
}

function contieneValorVacio(array) {
    return array.some(valor => valor.trim() === "");
}

export function eliminarElementosFormData(formData, tags) {
    tags.forEach((value, index) => {
        formData.delete(`${value}`)
      });

    // return nuevoFormData;
}