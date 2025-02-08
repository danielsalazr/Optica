from django.shortcuts import render
from .models import Clientes

from django.shortcuts import render, redirect
from django.http import HttpResponse, response, JsonResponse
from django.views.generic import ListView
from django.shortcuts import get_object_or_404
import django_excel as excel
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

#Django Rest Framework 
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .serializers import ClienteSerializer, EmpresaSerializer


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

@method_decorator(csrf_exempt, name='dispatch')
class Empresas(APIView):
    permission_classes = [AllowAny]
    #permission_classes = (IsAuthenticated, )
    def get(self, request):
        return Response({'Venta creada': 'ok'}, status=status.HTTP_200_OK)
    
    # @csrf_exempt
    def post(self, request,):

        console.log(request.data)

        data_copy = request.data.copy()

        serializer = EmpresaSerializer(data=data_copy)
        #serializer = VentaSerializer(data=listdata, many=True)

        if serializer.is_valid():
            
            serializer.save()
            return Response({'Venta creada': 'ok'}, status=status.HTTP_201_CREATED)
        
        console.log(serializer.errors)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@method_decorator(csrf_exempt, name='dispatch')
class Cliente(APIView):
    permission_classes = [AllowAny]
    #permission_classes = (IsAuthenticated, )
    def get(self, request):
        return Response({'Venta creada': 'ok'}, status=status.HTTP_200_OK)
    
    # @csrf_exempt
    def post(self, request,):

        console.log(request.data)

        data_copy = request.data.copy()

        serializer = ClienteSerializer(data=data_copy)
        #serializer = VentaSerializer(data=listdata, many=True)

        if serializer.is_valid():
            
            serializer.save()
            
            return Response({'Venta creada': 'ok'}, status=status.HTTP_201_CREATED)
            # return Response({'Venta creada': 'ok'}, status=status.HTTP_200_OK)
        
        console.log(serializer.errors)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)