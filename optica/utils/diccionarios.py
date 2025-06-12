def agrupar_datos(datos, clasificaciones):
    """
    Agrupa datos y ordena completamente:
    1. Primero campos principales (no listas)
    2. Luego listas ordenadas alfabéticamente
    3. Dentro de listas, diccionarios ordenados alfabéticamente
    """
    if not datos:
        return {}
    
    # Primero agrupamos los datos
    grupo = {nombre: [] for nombre, _ in clasificaciones}
    campos_clasificados = set().union(*[set(campos) for _, campos in clasificaciones])
    primer_nivel_campos = set(datos[0].keys()) - campos_clasificados
    
    # Añadir campos del primer nivel
    for campo in primer_nivel_campos:
        grupo[campo] = datos[0].get(campo)
    
    # Procesar cada item para las listas clasificadas
    for item in datos:
        for nombre_lista, campos in clasificaciones:
            item_clasificado = {campo: item.get(campo) for campo in campos}
            grupo[nombre_lista].append(item_clasificado)
    
    # Ordenar el diccionario principal: primero campos simples, luego listas
    def ordenar_diccionario(d):
        # Separar campos simples de listas
        campos_simples = {k: v for k, v in d.items() if not isinstance(v, list)}
        listas = {k: v for k, v in d.items() if isinstance(v, list)}
        
        # Ordenar cada parte alfabéticamente
        campos_simples_ordenados = dict(sorted(campos_simples.items()))
        listas_ordenadas = dict(sorted(listas.items()))
        
        # Combinar (primero campos simples, luego listas)
        return {**campos_simples_ordenados, **listas_ordenadas}
    
    # Ordenar diccionarios dentro de listas
    def ordenar_listas(obj):
        if isinstance(obj, dict):
            return ordenar_diccionario(obj)
        elif isinstance(obj, list):
            return [ordenar_listas(v) for v in obj]
        else:
            return obj
    
    resultado_ordenado = ordenar_listas(grupo)
    return resultado_ordenado