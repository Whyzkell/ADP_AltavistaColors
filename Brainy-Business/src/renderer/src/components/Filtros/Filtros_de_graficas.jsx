import React from 'react'

export default function Filtros_de_graficas() {
  return (
    <>
        <div className="flex justify-between ">
            <div className='flex w-1/3 justify-start'>
                <Anitos/>
                <Mesesitos/>
            </div>
            <div className='flex flex-row w-3/5 justify-end mr-3'>
                <ProCate nombre="Abarrotes" color={"bg-indigo-500"} />
                <ProCate nombre="Lacteos" color={"bg-violet-400"} />
                <ProCate nombre="Tecnologia" color={"bg-sky-400"} />
            </div>                        
        </div>
    </>
  )
}

