from django.shortcuts import render
from .models import Clientes

from django.shortcuts import render, redirect
from django.http import HttpResponse, response, JsonResponse
from django.views.generic import ListView
from django.shortcuts import get_object_or_404
import django_excel as excel

#Django Rest Framework 
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rich.console import Console
console = Console()

@api_view(['GET'])
def infoCliente(request, cedula = 0):
    info = Clientes.objects.filter(id=cedula).values()

    console.log(info)

    if info:
        return Response(info, status=status.HTTP_200_OK)
        # return JsonResponse(info, status=200)

    return Response({'response': 'Not found'}, status=status.HTTP_400_BAD_REQUEST)
