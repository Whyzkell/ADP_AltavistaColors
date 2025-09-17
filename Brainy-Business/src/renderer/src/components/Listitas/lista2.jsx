import React from 'react'

export default function Lista2({color,color2, color3, num, producto, cantidad, compo, porciento, ganancia,}) {
    return (
        <>
            <div className="flex 11/12 mt-4">
                <div className="w-1/12">
                    <p className={`text-xl ${color} h-10 w-10 flex justify-center items-center rounded-lg ${color2} font-medium`}>
                        {num}
                    </p>
                </div>
                <div className="w-4/12 flex items-center">
                    <p className="text-xl font-medium text-slate-700">{producto}</p>
                </div>
                <div className="w-2/12 flex items-center">
                    <p className="text-xl font-medium text-slate-700">{cantidad}</p>
                </div>
                <div className="w-3/12 flex items-center">
                    <img src={compo} />
                    <p className={`text-xl font-medium ml-3 ${color3}`}>{porciento}</p>
                </div>
                <div className="w-3/12 flex items-center">
                    <p className="text-xl font-medium text-slate-700">{ganancia}</p>
                </div>
            </div>
        </>
    )
}
