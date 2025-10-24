def queryGetGeneralInfo():
    query = """
        select 
            SUM(CASE WHEN anulado <> 1 THEN precio END) as "TotalVentas",
            SUM(CASE WHEN anulado <> 1 THEN totalAbono END) as "TotalAbonos",
            SUM(CASE WHEN anulado <> 1 THEN precio - totalAbono END) as "TotalSaldo",
            #SUM(precio),
            #SUM(totalAbono),
            #SUM(precio) - SUM(totalAbono),
            SUM(anulado = 1) AS "TotalVentasAnuladas"
        from contabilidad_ventas T0;
    """

    return query