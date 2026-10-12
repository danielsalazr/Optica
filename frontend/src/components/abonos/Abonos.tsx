// @ts-nocheck
import React, { useEffect, useState } from 'react'
import MedioPago from '@/components/MedioPago'
import { fromMoneyToText, fromNumberToMoney } from '@/utils/js/utils.js'
import { Calendar } from 'primereact/calendar'

import Button from 'react-bootstrap/Button'
import { useAuth } from '@/components/auth/AuthProvider';
import { parseCalendarDate, localISODate, paymentDueDate } from '@/utils/balances';

type MedioPagoRow = {
  id?: number | string;
  snapshot?: string;
  precio: number | string;
  descripcion?: string;
  descripcionAbono?: string;
  fecha_abono?: string;
  imagenMedioPago?: string;
  medioDePago_id?: number | string;
  medioPago?: string;
  total?: number | string;
};

type AbonosProps = {
  data: {
    mediosPago: Array<{
      id: number | string;
      nombre: string;
      imagen: string;
    }>;
    [key: string]: unknown;
  };
  ventaData: MedioPagoRow[];
  totalAbonoLoad: number;
  clear: boolean;
  changeClear: () => void;
  condicionPagoInit: string;
  compromisoPagoInit: number | string;
  fechaInicioInit: string;
  fechaVencimientoInit: string;
};

function Abonos(props: AbonosProps) {
  const { can } = useAuth();
  const {
    data,
    ventaData,
    totalAbonoLoad,
    clear,
    changeClear,
    condicionPagoInit,
    compromisoPagoInit,
    fechaInicioInit,
    fechaVencimientoInit,
  } = props


  const todayDate = new Date()
  const todayISO = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

  const [rows, setRows] = useState<MedioPagoRow[]>(
    ventaData && ventaData.length
      ? ventaData.map((item) => ({
          id: item.id,
          abono_masivo_id: item.abono_masivo_id,
          precio: fromNumberToMoney(item.precio),
          descripcion: item.descripcion,
          descripcionAbono: item.descripcion,
          imagenMedioPago: item.imagenMedioPago,
          medioDePago_id: item.medioDePago_id,
          medioPago: item.medioPago,
          total: item.precio,
          fecha_abono: item.fecha_abono || todayISO,
        }))
      : [
          {
            precio: '$ 0',
            fecha_abono: todayISO,
          },
        ]
  )

  const [abonoTotal, setAbonoTotal] = useState(totalAbonoLoad || 0)
  const [totalVenta, setTotalVenta] = useState(0)

  const [fechaInicioDate, setFechaInicioDate] = useState<Date | null>(todayDate)
  const [condicionPago, setCondicionPago] = useState('quincenal')
  const esContado = condicionPago === 'contado'
  const [compromisoPago, setCompromisoPago] = useState(1)
  const [fechaVencimientoDate, setFechaVencimientoDate] = useState<Date | null>(todayDate)

  useEffect(() => {
    if (condicionPagoInit === undefined && fechaInicioInit === undefined && fechaVencimientoInit === undefined) return;
    setCondicionPago(condicionPagoInit || 'quincenal');
    setCompromisoPago(Number(compromisoPagoInit) || 1);
    setFechaInicioDate(parseCalendarDate(fechaInicioInit));
    setFechaVencimientoDate(parseCalendarDate(fechaVencimientoInit));
  }, [condicionPagoInit, compromisoPagoInit, fechaInicioInit, fechaVencimientoInit])

  const toISODate = (value: Date | string | null | undefined) => {
    if (!value) return ""
    const date = value instanceof Date ? value : parseCalendarDate(value)
    if (!date) return ''
    return localISODate(date)
  }

  // Recalculate only for user changes, not when restoring a saved sale.
  const changePaymentTerms = (changes: { start?: Date | null; condition?: string; installments?: number }) => {
    const start = changes.start !== undefined ? changes.start : fechaInicioDate;
    const condition = changes.condition ?? condicionPago;
    const installments = condition === 'contado' ? 1 : changes.installments ?? compromisoPago;
    setFechaInicioDate(start);
    setCondicionPago(condition);
    setCompromisoPago(installments);
    setFechaVencimientoDate(paymentDueDate(start, condition, installments));
  };

  useEffect(() => {
    const total = rows.reduce(
      (acumulador, item) => acumulador + fromMoneyToText(item.precio),
      0
    )
    setAbonoTotal(total)
  }, [rows])

  useEffect(() => {
    const totalNode = document.getElementById('totalVenta')
    if (!totalNode) return

    const updateTotal = () => {
      const text = totalNode.textContent || ''
      setTotalVenta(fromMoneyToText(text))
    }

    updateTotal()

    const observer = new MutationObserver(() => updateTotal())
    observer.observe(totalNode, { childList: true, characterData: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  const addMetodoPago = () => {
    setRows((prevRows) => [
      ...prevRows,
      {
        precio: '$ 0',
        fecha_abono: todayISO,
      },
    ])
  }

  const handlePrecioChange = (index: number, value: string | number) => {
    const newRows = [...rows]
    newRows[index].precio = fromNumberToMoney(fromMoneyToText(String(value || 0)))
    newRows[index].total = newRows[index].precio
    setRows(newRows)

    setAbonoTotal(
      newRows.reduce(
        (acumulador, item) => acumulador + fromMoneyToText(item.precio),
        0
      )
    )
  }

  const handleFechaAbonoChange = (index: number, value: string) => {
    const newRows = [...rows]
    newRows[index].fecha_abono = value
    setRows(newRows)
  }

  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index)
    setRows(newRows)

    setAbonoTotal(
      newRows.reduce(
        (acumulador, item) => acumulador + fromMoneyToText(item.precio),
        0
      )
    )
  }


  useEffect(() => {
    console.log(clear)
    if (clear) {
      setRows([])
      changeClear()
    }
  }, [clear, changeClear])

  const saldo = Math.max(totalVenta - abonoTotal, 0)
  const cuotasNumero = Number(compromisoPago) || 0
  const valorCuota =
    cuotasNumero > 0 ? Number((saldo / cuotasNumero).toFixed(2)) : 0

  return (
    <div className="container mw-100 my-4 sale-payments-section">
      <h2 className="mb-4">Abonos</h2>

      <div className="row sale-payment-terms">
        <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
          <label htmlFor="fecha_inicio">Fecha de inicio</label>
          <Calendar
            inputId="fecha_inicio"
            value={fechaInicioDate}
            onChange={(e) => changePaymentTerms({ start: e.value ?? null })}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            className="w-100"
          />
          <input type="hidden" name="fecha_inicio" value={toISODate(fechaInicioDate)} />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3 sale-installments-field">
          <label htmlFor="compromisoPago">Compromiso de pago (Cuotas)</label>
          <input
            type="number"
            className="form-control"
            id="compromisoPago"
            placeholder="Cuotas"
            name="compromisoPago"
            min={1}
            value={compromisoPago}
            onChange={(e) => changePaymentTerms({ installments: Number(e.target.value) })}
            required
            readOnly={esContado}
          />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3 sale-payment-condition-field">
          <label htmlFor="condicion_pago">Condicion de pago</label>
          <select
            className="form-select"
            name="condicion_pago"
            id="condicion_pago"
            value={condicionPago}
            onChange={(e) => changePaymentTerms({ condition: e.target.value })}
          >
            <option value="contado">Contado</option>
            <option value="quincenal">Quincenal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
          <label htmlFor="fecha_Vencimiento">Fecha de vencimiento</label>
          <Calendar
            inputId="fecha_Vencimiento"
            value={fechaVencimientoDate}
            dateFormat="dd/mm/yy"
            showIcon
            className="w-100"
            readOnlyInput
          />
          <input
            type="hidden"
            name="fecha_Vencimiento"
            value={toISODate(fechaVencimientoDate)}
          />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
          <label htmlFor="password">Tipo de Pago</label>
          <select className="form-select" name="tipo_venta" id="tipo_venta">
            <option value="1">Personal</option>
            <option value="2">Por Empresa</option>
          </select>
        </div>
      </div>

      <div className="table-responsive mt-4" style={{ overflowX: 'visible' }}>
        <input type="hidden" name="abonosOriginales" value={JSON.stringify((ventaData || []).map((item) => String(item.id)))} />
        <input type="hidden" name="abonos_snapshots" value={JSON.stringify(Object.fromEntries((ventaData || []).filter((item) => item.id && item.snapshot).map((item) => [String(item.id), item.snapshot])))} />
        <table className="table table-bordered sale-payments-table">
          <thead className="table-light">
            <tr>
              <th style={{ width: '2%' }}>#</th>
              <th style={{ width: '30%' }}>Medio de Pago</th>
              <th style={{ width: '18%' }}>Fecha abono</th>
              <th>Descripcion</th>
              <th style={{ width: '20%' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td data-label="Abono" className="bg-secondary-subtle">
                  {index + 1}
                  <input type="hidden" name="abonoId" value={row.id || ''} />
                  {row.abono_masivo_id && <small className="d-block">Masivo #{row.abono_masivo_id}</small>}
                </td>
                <td data-label="Medio de pago" style={{ width: '25%' }}>
                  <MedioPago
                    data={data}
                    name="metodoPago"
                    className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3 w-100"
                    required={false}
                    disabled={Boolean(row.abono_masivo_id) || Boolean(row.id && !can('change_abonos'))}
                    setData={{
                      medioDePago_id: row.medioDePago_id ?? "",
                      medioPago: row.medioPago ?? "Seleccione una opcion",
                      imagenMedioPago: row.imagenMedioPago ?? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbyC6amH2B9H4vu3pEVEms33iwwLjgS1v0iw&s",
                    }}
                  />
                </td>
                <td data-label="Fecha del abono" style={{ width: '18%' }}>
                  <input
                    type="date"
                    className="form-control"
                    id={`fecha-abono-${index}`}
                    name="fechaAbono"
                    value={row.fecha_abono || ''}
                    readOnly={Boolean(row.id && !can('change_abonos'))}
                    onChange={(e) => handleFechaAbonoChange(index, e.target.value)}
                  />
                </td>
                <td data-label="Descripcion" width={40}>
                  <input
                    className="form-control"
                    id={`descripcion-${index}`}
                    name="descripcionAbono"
                    placeholder="descripcionAbono"
                    defaultValue={row.descripcionAbono ? row.descripcionAbono : ''}
                    readOnly={Boolean(row.id && !can('change_abonos'))}
                  />
                </td>
                <td data-label="Valor" width={150}>
                  <input
                    type="text"
                    className="form-control border-0 precio"
                    id={`precio_articulo-${index}`}
                    name="precioAbono"
                    inputMode="decimal"
                    step={1000}
                    placeholder="Precio"
                    value={row.precio}
                    readOnly={Boolean(row.abono_masivo_id) || Boolean(row.id && !can('change_abonos'))}
                    onChange={(e) => handlePrecioChange(index, e.target.value)}
                    onBlur={(e) => handlePrecioChange(index, e.target.value)}
                  />
                </td>
                <td style={{ width: '4.2%' }} className="text-center align-middle">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-danger text-decoration-none"
                    onClick={() => handleDeleteRow(index)}
                    aria-label="Eliminar abono"
                    title="Eliminar abono"
                    disabled={Boolean(row.abono_masivo_id) || Boolean(row.id && !can('delete_abonos'))}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={addMetodoPago}>
          Agregar abono
        </button>
        <div className="text-end">
          <div style={{ fontSize: 24 }}>
            <label className="" htmlFor="nombreCliente">
              Total:{' '}
            </label>
            <strong id="totalAbono">{fromNumberToMoney(abonoTotal)}</strong>
          </div>
          <div className="text-muted small">
            Saldo: <strong data-sale-balance>{fromNumberToMoney(saldo)}</strong>
          </div>
          {esContado && (
            <div className="text-muted small">
              En contado el abono debe cubrir el total de la compra y la venta queda a 1 cuota.
            </div>
          )}
          <div className="text-muted small">
            Cuotas ({cuotasNumero || 0}):{' '}
            <strong>{fromNumberToMoney(valorCuota)}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Abonos
