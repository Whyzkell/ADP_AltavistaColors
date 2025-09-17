import React from 'react'

export default function Lista1() {
    return (
        <>
            <div className="flex 11/12">
                <div className="w-1/12" />
                <div className="w-4/12">
                    <p className="text-lg font-medium text-slate-500">Producto</p>
                </div>
                <div className="w-2/12">
                    <p className="text-lg font-medium text-slate-500">Ventas</p>
                </div>
                <div className="w-3/12">
                    <p className="text-lg font-medium text-slate-500">Estadisticas</p>
                </div>
                <div className="w-3/12">
                    <p className="text-lg font-medium text-slate-500">
                        Ganancias mensuales
                    </p>
                </div>
            </div>
        </>
    )
}
