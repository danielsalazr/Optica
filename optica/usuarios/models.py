from django.db import models
from django.utils import timezone

# Create your models here.
class Usuarios(models.Model):
    pass

    class Meta:
            verbose_name = 'cliente'
            verbose_name_plural = 'Clientes'

class Clientes(models.Model):
    cedula = models.IntegerField(verbose_name="Cedula", primary_key=True, unique=True)
    nombre = models.CharField(verbose_name="Nombre", max_length=70, default="")
    telefono = models.CharField(verbose_name="Telefono", max_length=20, default="")
    email = models.EmailField(verbose_name="Email", max_length=60, default="")
    fechaRegistro = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)
    FechaNacimiento = models.DateField(verbose_name="Fecha de nacimiento", blank=True, null=True)
    
    class Meta:
        verbose_name = 'cliente'
        verbose_name_plural = 'Clientes'
        managed = True

    
    def __str__(self):
        return self.nombre
    

class Empresa(models.Model):
    id = models.AutoField(verbose_name="id", primary_key=True, unique=True)
    nombre = models.CharField(verbose_name="Nombre empresa", max_length=70, default="")
    nit = models.CharField(verbose_name="nit", max_length=20, default="", blank=True, null=True)
    email = models.EmailField(verbose_name="Email", max_length=60, default="", blank=True, null=True)
    personas_contacto = models.TextField(verbose_name="Personas contacto", blank=True, null=True)
    
    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        managed = True

    
    def __str__(self):
        return self.nombre