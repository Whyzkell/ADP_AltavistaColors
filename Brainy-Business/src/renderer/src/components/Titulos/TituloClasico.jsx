import React from 'react'



export default function TituloClasico({til}) {
  return (
    <>
        <div className='flex justify-start w-full'>
            <p className="w-1/3 text-3xl font-medium text-slate-700 mt-6">
                {til}
            </p>
        </div>
    </>
  )
}
