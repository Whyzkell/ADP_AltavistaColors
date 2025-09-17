import React from 'react'
import mensaje from '../../../../../resources/Form_619.png'


export default function Lista3({imagen, nombre, money}) {
    return (
        <>
            <div className="flex justify-around w-full items-center mt-4">
                <img src={imagen} />
                <p className="text-xl text-center font-medium text-slate-700">
                    {nombre}
                </p>
                <p className="text-xl text-center font-medium text-slate-700">
                    {money}
                </p>
                <img src={mensaje} />
            </div>
        </>
    )
}
