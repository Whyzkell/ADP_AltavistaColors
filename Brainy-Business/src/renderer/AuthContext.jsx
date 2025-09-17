import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'
import { api } from './src/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) fetchUserData().finally(() => setLoading(false))
    else setLoading(false)
  }, [])

  const fetchUserData = async () => {
    const { data } = await api.get('/auth/me')
    setUser(data)
    return data
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email_usuario: email,
      contra_usuario: password
    })
    localStorage.setItem('token', data.token)
    await fetchUserData()
    return { ok: true }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading,
    fetchUserData
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
