import React from 'react'

export default function ProCate({nombre, color}) {
    return (
        <>
            <div className="flex justify-around w-32 items-center rounded-lg  mt-6">
                <div className={`h-5 w-5 ${color} rounded-full`} />
                <p className="text-sm font-medium">{nombre}</p>
            </div>
        </>
    )
}
