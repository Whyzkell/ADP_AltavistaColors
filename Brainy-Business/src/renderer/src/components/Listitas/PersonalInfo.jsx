import React from 'react'

export default function PersonalInfo({ til, nombre, accion }) {
  return (
    <div>
      <div className="flex flex-col h-16 mt-4">
        <div className="flex justify-between">
          <p className="font-medium">{til}</p>
          <p className="font-medium">{accion}</p>
        </div>
        <p>{nombre}</p>
      </div>
    </div>
  )
}
