// @ts-nocheck
"use client";

import { useState, useMemo, useCallback } from 'react';
import VentaForm from './VentaForm';
import RemisionesPanel from '@/components/remisiones/RemisionesPanel';

export default function VentaUpdateForm({ data, ventaData }) {
    const [dataVenta, setDataVenta] = useState(ventaData);
    const clientes = data.clientes || [];
    const esVentaContadoRemisionada = String(dataVenta?.condicion_pago || '').trim().toLowerCase() === 'contado'
        && (dataVenta?.remisiones?.length || 0) > 0;

    const clienteInfo = useMemo(() => {
        const clienteEncontrado = clientes.find(
            (elemento) => Number(elemento.cedula) === Number(dataVenta.cliente_id)
        );

        if (clienteEncontrado) {
            return {
                cedula: clienteEncontrado.cedula,
                nombre: clienteEncontrado.nombre,
                telefono: clienteEncontrado.telefono,
            };
        }

        return {
            cedula: dataVenta.cliente_id,
        };
    }, [clientes, dataVenta.cliente_id]);

    const handleRemisionCreated = useCallback((remision: any) => {
        setDataVenta((prev) => {
            if (!prev) {
                return prev;
            }

            const remisionesPrevias = Array.isArray(prev.remisiones) ? prev.remisiones : [];
            const ventasActualizadas = Array.isArray(prev.ventas)
                ? prev.ventas.map((item) => {
                    const detalle = remision.items.find(
                        (detalleItem: any) => detalleItem.itemVenta === item.id
                    );
                      if (!detalle) {
                          return item;
                      }

                      return {
                          ...item,
                          remisionado: detalle.cantidadDespachada,
                          pendienteRemision: detalle.restante,
                      };
                })
                : prev.ventas;

            return {
                ...prev,
                remisiones: [remision, ...remisionesPrevias],
                ventas: ventasActualizadas,
            };
        });
    }, [setDataVenta]);



    return (
        <div className="sale-create-page">
            <VentaForm data={data} ventaData={dataVenta} disabled={esVentaContadoRemisionada} />
            <div className="container-md px-0 mt-5">
                <RemisionesPanel
                    ventaId={Number(dataVenta?.id || dataVenta?.pedido || 0)}
                    items={dataVenta.ventas ?? []}
                    remisiones={dataVenta.remisiones ?? []}
                    articulos={data.articulos ?? []}
                    cliente={clienteInfo}
                    onCreated={handleRemisionCreated}
                />
            </div>
        </div>
    );
}
