from django.db import models
from django.utils import timezone

# Create your models here.
class Usuarios(models.Model):
    pass

    class Meta:
            verbose_name = 'cliente'
            verbose_name_plural = 'Clientes'

class Clientes(models.Model):
    id = models.IntegerField(verbose_name="Cedula", primary_key=True, unique=True)
    nombre = models.CharField(verbose_name="Nombre", max_length=50, default="")
    apellido = models.CharField(verbose_name="Apellido", max_length=50, default="")
    telefono = models.CharField(verbose_name="Telefono", max_length=20, default="")
    email = models.EmailField(verbose_name="Email", max_length=60, default="")
    fechaRegistro = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)
    
    class Meta:
        verbose_name = 'cliente'
        verbose_name_plural = 'Clientes'
        managed = True

    
    def __str__(self):
        return self.nombre