import React from 'react'



export default function TopCompra({foto, nombre, total, porciento, grafica}) {
    return (
        <>
            <div className="carousel-item bg-white w-44 h-72 flex flex-col p-8 rounded-lg mx-2">
                <img src={foto} className="h-10 w-10 mb-3" />
                <p className="text-basic text-center font-medium text-slate-700 mb-3 -ml-8">
                    {nombre}
                </p>
                <p className="text-4xl text-center font-medium text-slate-700 mb-2 -ml-8">
                    {total}
                </p>
                <p className="text-xl font-medium  text-green-500 mb-3 -ml-2">
                    {porciento}
                </p>
                <img src={grafica} />
            </div>
        </>
    )
}
