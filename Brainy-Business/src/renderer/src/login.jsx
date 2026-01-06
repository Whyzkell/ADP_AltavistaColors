import React, { useState } from 'react'
import { FaUser, FaLock } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext' // ajusta la ruta si tu AuthContext está en otro sitio

import Logito from '../../../resources/logo.png'

// Componentes de UI (los del diseño)
import InputIconPlaceHolder from '../src/components/Inputs/InputIconPlaceHolder.jsx'
import InputIconPlaceHolderContra from '../src/components/Inputs/InputIconPlaceHolderContrasenia.jsx'
import SubmitButtonAzul from '../src/components/Buttons/SubmitButtonAzul.jsx'

export default function Login() {
  // ---- estado y navegación (funcionalidad del segundo login) ----
  const [formData, setFormData] = useState({ email_usuario: '', contra_usuario: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  // IMPORTANTE:
  // Tus componentes InputIconPlaceHolder / InputIconPlaceHolderContrasenia
  // deben **reenviar** props como `value`, `onChange`, `id`, `name` al <input /> interno.
  // Si ya lo hacen, esto funcionará tal cual.
  const handleChange = (e) => setFormData((s) => ({ ...s, [e.target.id]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const ok = await login(formData.email_usuario, formData.contra_usuario)
      if (ok) navigate('/app')
      else setError('Credenciales inválidas')
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Lado izquierdo (form) */}
      <div className="w-7/12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-8 text-center">INICIAR SESIÓN</h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              {/* Email — usamos el diseño pero con ids de la lógica */}
              <InputIconPlaceHolder
                icon={FaUser}
                placeholder="Usuario"
                id="email_usuario"
                name="email_usuario"
                value={formData.email_usuario}
                onChange={handleChange}
                type="text"
                required
              />
            </div>

            <div className="relative">
              {/* Contraseña — usamos el diseño pero con ids de la lógica */}
              <InputIconPlaceHolderContra
                icon={FaLock}
                placeholder="Contraseña"
                id="contra_usuario"
                name="contra_usuario"
                value={formData.contra_usuario}
                onChange={handleChange}
                required
              />
            </div>

            {/* Mensaje de error (si lo hay) */}
            {error && <p className="text-red-500 text-sm -mt-2">{error}</p>}

            {/* Botón submit del diseño */}
            <div className="flex justify-center items-center">
              <div className="w-1/3">
                {' '}
                <SubmitButtonAzul texto="INGRESAR" type="submit" />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Lado derecho (gradiente y “cristal”) */}
      <div className="hidden md:flex w-5/12 items-center justify-center bg-gradient-to-tr from-[#11A5A3]/55 to-[#07A104]/10">
        <div className="flex justify-center items-center  w-3/4 h-3/4 rounded-3xl bg-white/20 bg-opacity-20 backdrop-blur-lg border border-white/30 shadow-lg">
          <img src={Logito} className="w-10/12 " />
        </div>
      </div>
    </div>
  )
}
