// @ts-nocheck
﻿export const dynamic = 'force-dynamic';

import React from 'react'
import Link from "next/link";

import VentasData from '@/components/ventas/VentasData';
import { buildServerBackendUrl } from '@/utils/js/env';

import '@/styles/selectwithImage.css';
import "intl-tel-input/build/css/intlTelInput.css";

type VentaRow = {
  precio: number | string;
  totalAbono: number | string;
  saldo: number | string;
  estado_pedido_id: number | null;
  estado_pedido_nombre: string;
  motivo_sin_anticipo: string;
  estado_pedido_actualizado: string | null;
  [key: string]: unknown;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatMoney = (value: unknown) => currencyFormatter.format(Number(value || 0));

async function getDataVentas() {
  const res = await fetch(buildServerBackendUrl("venta/"), {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data: VentaRow[] = await res.json();
  return data;
}

async function getGeneralData() {
  const res = await fetch(buildServerBackendUrl("ventas/"), {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }
  return res.json();
}

async function page() {
  let table: VentaRow[] = [];
  let generalData = {};

  try {
    const [ventas, general] = await Promise.all([getDataVentas(), getGeneralData()]);
    table = ventas;
    generalData = general;
  } catch (error) {
    console.error('Error cargando /ventas:', error);
  }

  const formattedTable = table.map((item: VentaRow) => {
    const precioRaw = Number(item.precio || 0);
    const totalAbonoRaw = Number(item.totalAbono || 0);
    const saldoRaw = Number(item.saldo || 0);
    return {
      ...item,
      precioRaw,
      totalAbonoRaw,
      saldoRaw,
      precio: formatMoney(precioRaw),
      totalAbono: formatMoney(totalAbonoRaw),
      saldo: formatMoney(saldoRaw),
      estadoPedidoId: item.estado_pedido_id ?? null,
      estadoPedidoNombre: item.estado_pedido_nombre || '',
      motivoSinAnticipo: item.motivo_sin_anticipo || '',
      estadoPedidoFecha: item.estado_pedido_actualizado ?? null,
    };
  });

  return (
    <div className="page-shell">
      <div className="ventas-toolbar">
        <Link href="/" className="floating-back-button">
          <i className="fa-solid fa-arrow-left" />
        </Link>
        <h1 className="ventas-page-title mb-0">Ventas</h1>
        <Link href="/ventas/crearVenta" className="btn btn-primary fw-semibold px-4 py-2 rounded-pill">
          Crear venta
        </Link>
      </div>

      <div className="ventas-card">
        <VentasData data={formattedTable} generalData={generalData} />
      </div>
    </div>
  )
}

export default page

