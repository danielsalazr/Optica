"use client"
import React from 'react';
import { TrendingUp, DollarSign, CreditCard, XCircle, AlertCircle } from 'lucide-react';
import { TbBackground } from 'react-icons/tb';
import { useState, useEffect } from 'react';

const SalesIndicator = () => {



    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('es-CO').format(num);
    };

    const calculatePercentage = (value, total) => {
        return ((value / total) * 100).toFixed(1);
    };

    // const indicators = 

    const [generalInfo, setGeneralInfo] = useState([]);

    useEffect(() => {

        const fetchData = async () => {
            const req = await fetch("http://localhost:8000/informacionGeneral/");
            const data = await req.json();

            console.log(data)

            setGeneralInfo([
                {
                    title: "Ventas Totales",
                    value: formatCurrency(data.TotalVentas),
                    icon: TrendingUp,
                    color: "oklch(69.6% 0.17 162.48)",
                    textColor: "oklch(59.6% 0.145 163.225)",
                    bgColor: "oklch(97.9% 0.021 166.113)",
                    trend: "+12.5%"
                },
                {
                    title: "Abonos Recibidos",
                    value: formatCurrency(data.TotalAbonos),
                    icon: CreditCard,
                    color: "oklch(62.3% 0.214 259.815)",
                    textColor: "oklch(54.6% 0.245 262.881)",
                    bgColor: "oklch(97% 0.014 254.604)",
                    percentage: `${calculatePercentage(data.TotalAbonos, data.TotalVentas)}% del total`
                },
                {
                    title: "Saldo Pendiente",
                    value: formatCurrency(data.TotalSaldo),
                    icon: DollarSign,
                    color: "oklch(76.9% 0.188 70.08)",
                    textColor: "oklch(66.6% 0.179 58.318)",
                    bgColor: "oklch(98.7% 0.022 95.277)",
                    percentage: `${calculatePercentage(data.TotalSaldo, data.TotalVentas)}% pendiente`
                },
                {
                    title: "Ventas Anuladas",
                    value: formatNumber(data.TotalVentasAnuladas),
                    icon: XCircle,
                    color: "oklch(63.7% 0.237 25.331)",
                    textColor: "oklch(57.7% 0.245 27.325)",
                    bgColor: "oklch(97.1% 0.013 17.38)",
                    //suffix: "ventas"
                    percentage: "ventas"
                }
            ]);


        }

        fetchData();
    }, [])



    return (
        <div className=" bg-gray-50 p-">
            <div className="max-w-7xl mx-auto"
                style={{ background: "oklch(98.5% 0.002 247.839)" }}
            >
                {/* Header */}
                {/* <div className="mb-8">
                    <h1 className="fw-bold mb-2"
                        style={{
                            fontSize: "30px",
                            color: "oklch(21% 0.034 264.665)"
                        }}
                    >
                        Dashboard de Ventas
                    </h1>
                    <p className="text-gray-600">
                        Vista general de indicadores de rendimiento
                    </p>
                </div> */}

                {/* KPI Cards */}
                <div className="d-flex gap-2 mb-2 justify-content-between">
                    {generalInfo.map((indicator, index) => {
                        const Icon = indicator.icon;
                        return (
                            <div
                                key={index}
                                className={`d-flex justify-content-between align-items-center rounded-4 px-4 py-0 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300`}
                                style={{ background: indicator.bgColor, boxShadow: "var(--shadow-sm)", border: "1px solid #e5e7eb", transition: "box-shadow 300ms", height: "130px" }}
                            >
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                    <div className={`p-3 rounded-4`}
                                        style={{ color: indicator.color }}
                                    >
                                        <Icon className="h-6 w-6 text-green-500" />
                                    </div>
                                    {indicator.trend && (
                                        <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                            {indicator.trend}
                                        </span>
                                    )}
                                </div>



                                <div className="space-y-2">
                                    <h3 className="text-sm   text-uppercase tracking-wide fw-bold mb-0"
                                        style={{ color: "oklch(55.1% 0.027 264.364)", fontSize: "12px", lineHeight: "calc(2 / 1.5)", }}
                                    >
                                        {indicator.title}
                                    </h3>
                                    <div className="flex items-baseline space-x-2 ">
                                        <p className={`fw-bold`}
                                            style={{ color: indicator.textColor, fontSize: "24px", lineHeight: "calc(2 / 1.5)", fontWeight: "bold" }}
                                        >
                                            {indicator.value}
                                        </p>
                                        {indicator.suffix && (
                                            <span className=""
                                                style={{ color: "oklch(55.1% 0.027 264.364)", fontSize: "14px", lineHeight: "calc(1.25 / 0.875)" }}
                                            >{indicator.suffix}</span>
                                        )}
                                    </div>
                                    {indicator.percentage && (
                                        <p className=" text-gray-500"
                                            style={{ color: "oklch(55.1% 0.027 264.364)", fontSize: "12px", lineHeight: "calc(1 / 1.75)" }}
                                        >{indicator.percentage}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {/* 
                    <div className="bg-white rounded-4 p-6 shadow-sm border border-gray-200">
                        <div className="d-flex items-center mb-4">
                            <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Estado de Pagos
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Porcentaje Cobrado</span>
                                <span className="font-semibold text-blue-600">
                                    {calculatePercentage(salesData.TotalAbonos, salesData.TotalVentas)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${calculatePercentage(salesData.TotalAbonos, salesData.TotalVentas)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Saldo por Cobrar</span>
                                <span className="font-semibold text-amber-600">
                                    {calculatePercentage(salesData.TotalSaldo, salesData.TotalVentas)}%
                                </span>
                            </div>
                        </div>
                    </div> */}

                    {/* Quick Stats */}
                    {/* <div className="bg-white rounded-4 p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                            <TrendingUp className="h-5 w-5 text-emerald-500 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Resumen Rápido
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Efectividad de Cobro</span>
                                <span className="font-semibold text-emerald-600">
                                    {calculatePercentage(salesData.TotalAbonos, salesData.TotalVentas)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ventas Exitosas</span>
                                <span className="font-semibold text-emerald-600">
                                    {formatCurrency(salesData.TotalVentas - (salesData.TotalVentasAnuladas * 1000000))}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tasa de Anulación</span>
                                <span className="font-semibold text-red-600">
                                    {((salesData.TotalVentasAnuladas / (salesData.TotalVentas / 1000000)) * 100).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Summary Cards */}
                <div className="d-flex gap-6">
                    {/* Payment Status */}

                </div>
            </div>
        </div >
    );
};

export default SalesIndicator;