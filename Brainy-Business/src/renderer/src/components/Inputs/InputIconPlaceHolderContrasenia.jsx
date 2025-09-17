import React, { useState } from 'react'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'

/**
 * icon: componente react-icons (p.ej. FaLock) o ruta/URL
 * Reenvía value, onChange, id, name, required... al <input />
 */
const InputIconPlaceHolderContra = ({ icon, placeholder, className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false)
  const isReactIcon = typeof icon === 'function'

  return (
    <div
      className={`relative flex items-center bg-[#F0EDFF] bg-opacity-80 rounded-[16px] h-[52px] w-full ${className}`}
    >
      <div className="absolute left-4 text-gray-400">
        {isReactIcon ? (
          React.createElement(icon, { className: 'text-xl' })
        ) : icon ? (
          <img src={icon} alt="" className="w-5 h-5 opacity-70" />
        ) : null}
      </div>

      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        className="w-full h-full pl-12 pr-10 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
        {...props} // <- id, name, value, onChange, required...
      />

      <button
        type="button"
        onClick={() => setShowPassword((s) => !s)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-600"
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
      </button>
    </div>
  )
}

export default InputIconPlaceHolderContra
