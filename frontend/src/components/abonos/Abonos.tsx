import React, { useEffect, useState } from 'react'
import MedioPago from '@/components/MedioPago'
import { executeUtils } from '@/utils/js/utils.js'
import { fromMoneyToText, fromNumberToMoney } from '@/utils/js/utils.js'
import { Calendar } from 'primereact/calendar'

import Button from 'react-bootstrap/Button'
import 'boxicons'

function Abonos(props) {
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

  console.log(ventaData)
  console.log(data)
  console.log(totalAbonoLoad)

  const [rows, setRows] = useState(
    ventaData
      ? ventaData.map((item) => ({
          precio: fromNumberToMoney(item.precio),
          descripcionAbono: item.descripcion,
          imagenMedioPago: item.imagenMedioPago,
          medioDePago_id: item.medioDePago_id,
          medioPago: item.medioPago,
        }))
      : [
          {
            precio: '$ 0',
          },
        ]
  )

  const [abonoTotal, setAbonoTotal] = totalAbonoLoad
    ? useState(totalAbonoLoad)
    : useState(0)
  const [totalVenta, setTotalVenta] = useState(0)

  const todayDate = new Date()
  const [fechaInicioDate, setFechaInicioDate] = useState(todayDate)
  const [condicionPago, setCondicionPago] = useState('quincenal')
  const [compromisoPago, setCompromisoPago] = useState(1)
  const [fechaVencimientoDate, setFechaVencimientoDate] = useState(todayDate)

  useEffect(() => {
    if (condicionPagoInit) {
      setCondicionPago(condicionPagoInit);
    }
    if (compromisoPagoInit) {
      setCompromisoPago(Number(compromisoPagoInit));
    }
    if (fechaInicioInit) {
      setFechaInicioDate(new Date(fechaInicioInit));
    }
    if (fechaVencimientoInit) {
      setFechaVencimientoDate(new Date(fechaVencimientoInit));
    }
  }, [condicionPagoInit, compromisoPagoInit, fechaInicioInit, fechaVencimientoInit])

  const toISODate = (value) => {
    if (!value) return ""
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const addDaysSkipping31 = (startDate, days) => {
    if (!startDate || !days || days <= 0) return startDate
    const fecha = new Date(startDate)
    if (Number.isNaN(fecha.getTime())) return startDate
    let count = 0
    while (count < days) {
      fecha.setDate(fecha.getDate() + 1)
      if (fecha.getDate() !== 31) {
        count += 1
      }
    }
    return fecha
  }

  useEffect(() => {
    const multiplicador = condicionPago === 'mensual' ? 30 : 15
    const cuotas = Number(compromisoPago) || 0
    const dias = cuotas * multiplicador
    setFechaVencimientoDate(addDaysSkipping31(fechaInicioDate, dias))
  }, [fechaInicioDate, condicionPago, compromisoPago])

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
      },
    ])
  }

  const handlePrecioChange = (index, value) => {
    const newRows = [...rows]
    newRows[index].precio = value || 0
    newRows[index].total = newRows[index].precio
    setRows(newRows)

    setAbonoTotal(
      newRows.reduce(
        (acumulador, item) => acumulador + fromMoneyToText(item.precio),
        0
      )
    )
  }

  const handleDeleteRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index)
    setRows(newRows)

    setAbonoTotal(
      newRows.reduce(
        (acumulador, item) => acumulador + fromMoneyToText(item.precio),
        0
      )
    )
  }

  const handleLoad = () => {
    executeUtils()
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
    <div className="container mw-100 my-4" onLoad={handleLoad}>
      <h2 className="mb-4">Abonos</h2>

      <div className="row">
        <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
          <label htmlFor="fecha_inicio">Fecha de inicio</label>
          <Calendar
            inputId="fecha_inicio"
            value={fechaInicioDate}
            onChange={(e) => setFechaInicioDate(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            className="w-100"
          />
          <input type="hidden" name="fecha_inicio" value={toISODate(fechaInicioDate)} />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
          <label htmlFor="compromisoPago">Compromiso de pago (Cuotas)</label>
          <input
            type="number"
            className="form-control"
            id="compromisoPago"
            placeholder="Cuotas"
            name="compromisoPago"
            min={1}
            value={compromisoPago}
            onChange={(e) => setCompromisoPago(e.target.value)}
            required
          />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
          <label htmlFor="condicion_pago">Condicion de pago</label>
          <select
            className="form-select"
            name="condicion_pago"
            id="condicion_pago"
            value={condicionPago}
            onChange={(e) => setCondicionPago(e.target.value)}
          >
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
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th style={{ width: '2%' }}>#</th>
              <th style={{ width: '35%' }}>Medio de Pago</th>
              <th>Descripcion</th>
              <th style={{ width: '20%' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="bg-secondary-subtle">{index + 1}</td>
                <td style={{ width: '25%' }}>
                  <MedioPago
                    data={data}
                    name="metodoPago"
                    className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3 w-100"
                    required={false}
                    setData={row}
                  />
                </td>
                <td width={40}>
                  <input
                    className="form-control"
                    id={`descripcion-${index}`}
                    name="descripcionAbono"
                    placeholder="descripcionAbono"
                    defaultValue={row.descripcionAbono ? row.descripcionAbono : ''}
                  />
                </td>
                <td width={150}>
                  <input
                    type="text"
                    className="form-control border-0 precio"
                    id={`precio_articulo-${index}`}
                    name="precioAbono"
                    step={1000}
                    placeholder="Precio"
                    value={row.precio}
                    onChange={(e) => handlePrecioChange(index, e.target.value)}
                    onBlur={(e) => handlePrecioChange(index, e.target.value)}
                    defaultValue={`$ 0`}
                  />
                </td>
                <box-icon
                  type="solid"
                  onClick={() => handleDeleteRow(index)}
                  size="md"
                  name="trash"
                  style={{ display: 'table-cell', width: '4.2%' }}
                  color="red"
                ></box-icon>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={addMetodoPago}>
          Agregar Fila
        </button>
        <div className="text-end">
          <div style={{ fontSize: 24 }}>
            <label className="" htmlFor="nombreCliente">
              Total:{' '}
            </label>
            <strong id="totalAbono">{fromNumberToMoney(abonoTotal)}</strong>
          </div>
          <div className="text-muted small">
            Saldo: <strong>{fromNumberToMoney(saldo)}</strong>
          </div>
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
