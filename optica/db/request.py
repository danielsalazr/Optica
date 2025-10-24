from django.db import connection
from .queries import (
    queryGetGeneralInfo
)


from rich.console import Console
console = Console()


def select_query(query):
    connection = None
    try:
        connection = connection_pool.get_connection()
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute('FLUSH QUERY CACHE;')
            cursor.execute(query)
            rows = cursor.fetchall()
            # connection.commit()
            return rows
    except Error as e:
        print("Error al ejecutar la consulta SELECT:", e)
    finally:
        if connection:
            connection.rollback()
            connection.close()


# Método para realizar consultas de inserción
def insert_query(query, values):
    connection = None
    try:
        connection = connection_pool.get_connection()
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute(query)
            connection.commit()
            print("Inserción exitosa.")
    except Error as e:
        print("Error al ejecutar la consulta de inserción:", e)
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()


# Método para realizar actualizaciones
def update_query(query, values):
    connection = None
    try:
        connection = connection_pool.get_connection()
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute(query)
            connection.commit()
            print("Actualización exitosa.")
    except Error as e:
        print("Error al ejecutar la actualización:", e)
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()


# Método para borrar registros
def delete_query(query):
    connection = None
    try:
        connection = connection_pool.get_connection()
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute(query)
            connection.commit()
            print("Borrado exitoso.")
    except Error as e:
        print("Error al ejecutar el borrado:", e)
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()


def getGeneralInfo():
    with connection.cursor() as cursor:
            cursor.execute(queryGetGeneralInfo())
            # data = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            data = [dict(zip(columns, row)) for row in cursor.fetchall()][0]
            console.log(data)
    return data


def lol():
    pass