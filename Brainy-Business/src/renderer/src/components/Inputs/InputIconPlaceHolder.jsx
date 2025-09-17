import React from 'react'

/**
 * icon: puede ser un componente (p.ej. FaUser) o una ruta/URL de imagen.
 * Pasa value, onChange, id, name, type, required... al <input /> vía ...props
 */
const InputIconPlaceHolder = ({ placeholder, icon, className = '', ...props }) => {
  const isReactIcon = typeof icon === 'function' // FaUser, etc.

  return (
    <div
      className={`relative flex items-center bg-[#F0EDFF] bg-opacity-80 rounded-[16px] h-[52px] w-full ${className}`}
    >
      <div className="absolute left-4 text-gray-400">
        {isReactIcon ? (
          // Componente de icono (react-icons)
          React.createElement(icon, { className: 'text-xl' })
        ) : icon ? (
          // Imagen
          <img src={icon} alt="" className="w-5 h-5 opacity-70" />
        ) : null}
      </div>

      <input
        placeholder={placeholder}
        className="w-full h-full pl-12 pr-4 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
        {...props} // <- aquí viajan value, onChange, id, name, type, required, etc.
      />
    </div>
  )
}

export default InputIconPlaceHolder
