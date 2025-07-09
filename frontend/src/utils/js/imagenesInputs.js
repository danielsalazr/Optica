const imagenesInput = document.getElementById('imagenes');
    const previsualizadores = document.getElementById('previsualizadores');
    let archivosSeleccionados = []; // Arreglo global para mantener los archivos seleccionados

    // Esto los pinta
    function actualizarVisualizadorArchivos() {
        previsualizadores.innerHTML = ''; // Limpia la previsualización

        // Itera sobre los archivos seleccionados y crea la previsualización
        archivosSeleccionados.forEach((archivo, index) => {
            const reader = new FileReader();
            const previsualizador = document.createElement('div');
            previsualizador.style.position = 'relative';
            previsualizador.style.width = '120px';
            previsualizador.style.height = '120px';
            previsualizador.style.border = '1px solid #ddd';
            previsualizador.style.padding = '5px';
            previsualizador.style.display = 'inline-block';
            previsualizador.style.margin = '5px';

            const botonEliminar = document.createElement('button');
            botonEliminar.textContent = 'X';
            botonEliminar.style.position = 'absolute';
            botonEliminar.style.top = '5px';
            botonEliminar.style.right = '5px';
            botonEliminar.style.background = 'red';
            botonEliminar.style.color = 'white';
            botonEliminar.style.border = 'none';
            botonEliminar.style.borderRadius = '50%';
            botonEliminar.style.cursor = 'pointer';
            botonEliminar.style.width = '20px';
            botonEliminar.style.height = '20px';
            botonEliminar.style.display = 'flex';
            botonEliminar.style.alignItems = 'center';
            botonEliminar.style.justifyContent = 'center';
            botonEliminar.style.fontSize = '12px';

            botonEliminar.addEventListener('click', (e) => {
                e.preventDefault();
                eliminarArchivo(index);
            });

            reader.onload = (e) => {
                const imagen = e.target.result;
                const imgElement = document.createElement('img');
                imgElement.src = imagen;
                imgElement.style.width = '100%';
                imgElement.style.height = '100%';
                imgElement.style.objectFit = 'cover';
                previsualizador.appendChild(imgElement);
                previsualizador.appendChild(botonEliminar);
                previsualizadores.appendChild(previsualizador);
            };

            reader.readAsDataURL(archivo);
        });
    }

    async function eliminarArchivo(index) {
      const dt = new DataTransfer();
      await archivosSeleccionados.splice(index, 1);

      for (let i = 0; i < imagenesInput.files.length; i++) {
          console.log("iterador: ${i}, index ${index}")
          if (i !== index) {
              await dt.items.add(imagenesInput.files[i]);
          }
      }
      imagenesInput.files = dt.files;
      actualizarVisualizadorArchivos();
    }


    // Actualiza el atributo files del input
    function actualizarInputFiles() {
      const dt = new DataTransfer();
      archivosSeleccionados.forEach((archivo) => dt.items.add(archivo)); // Añade cada archivo al DataTransfer
      imagenesInput.files = dt.files; // Actualiza el input con los nuevos archivos
    }

    // Maneja el cambio en el input
    imagenesInput.addEventListener('change', async (e) => {
      const nuevosArchivos = Array.from(e.target.files); // Convierte FileList a array
      archivosSeleccionados = await archivosSeleccionados.concat(nuevosArchivos); // Combina los nuevos con los existentes
      actualizarInputFiles(); // Actualiza el atributo files del input
      actualizarVisualizadorArchivos(); // Actualiza la previsualización
    });

export {}