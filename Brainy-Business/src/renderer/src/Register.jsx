import React, { useState } from 'react'
import axios from 'axios'
import recta from '../../../resources/rectangulo 2.png'
import recta1 from '../../../resources/rectangulo.png'
import mac from '../../../resources/mac.png'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { api } from './api'

export default function Registro() {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email_usuario: '',
    contra_usuario: '',
    confirmar_contra: ''
  })

  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const { login } = useAuth()

  const { fetchUserData } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.contra_usuario !== formData.confirmar_contra) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      const { data } = await api.post('/auth/register', {
        nombre_usuario: formData.nombre_usuario,
        email_usuario: formData.email_usuario,
        contra_usuario: formData.contra_usuario
      })

      // 🔑 guarda token y trae /me
      localStorage.setItem('token', data.token)
      await fetchUserData()

      navigate('/app')
    } catch (error) {
      setError(error.response?.data?.error || 'Error al registrar')
    }
  }

  return (
    <>
      <div className="flex static w-full items-center bg-white">
        <section className="w-1/2 min-h-screen relative">
          <img src={recta} className="absolute inset-y-0 left-0" />
          <img src={recta1} className="absolute inset-0 left-4" />
          <img src={mac} className="absolute bottom-0" />
        </section>
        <section className="w-1/2 flex h-full flex-col items-center gap-3">
          <h1 className="font-bold">Please Fill out form to Register!</h1>
          <form onSubmit={handleSubmit} className="w-2/4 flex flex-col gap-3">
            <div className="flex flex-col">
              <label
                htmlFor="nombre_usuario"
                className="block mb-1 text-sm font-medium text-gray-900 dark:text-black"
              >
                Username:
              </label>
              <input
                type="text"
                id="nombre_usuario"
                className="h-8 border border-indigo-500 rounded-xl bg-white pl-3"
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="email_usuario"
                className="block mb-1 text-sm font-medium text-gray-900 dark:text-black"
              >
                E-mail:
              </label>
              <input
                type="email"
                id="email_usuario"
                className="h-8 border border-indigo-500 rounded-xl bg-white pl-3"
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="contra_usuario"
                className="block mb-1 text-sm font-medium text-gray-900 dark:text-black"
              >
                Password:
              </label>
              <input
                type="password"
                id="contra_usuario"
                className="h-8 border border-indigo-500 rounded-xl bg-white pl-3"
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="confirmar_contra"
                className="block mb-1 text-sm font-medium text-gray-900 dark:text-black"
              >
                Confirm password:
              </label>
              <input
                type="password"
                id="confirmar_contra"
                className="h-8 border border-indigo-500 rounded-xl bg-white pl-3"
                onChange={handleChange}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-800 w-full h-8 rounded-xl text-white mt-4 transition-colors duration-300"
            >
              Register
            </button>
          </form>
          <h1 className="mt-2">
            Already have an account?{' '}
            <span className="font-bold border-b-2 border-black" id="register-btn">
              <a href="/login">Login</a>
            </span>
          </h1>
        </section>
      </div>
    </>
  )
}
