import React from 'react'
import { useAuth } from '../AuthContext'
import { Navigate } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import TituloClasico from './components/Titulos/TituloClasico'
import PersonalInfo from './components/Listitas/PersonalInfo'

import ojo from '../../../resources/ojo.png'
import seguro from '../../../resources/seguro.png'
import candado from '../../../resources/candado.png'

export default function Ajustes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <>
      <div className="flex w-full justify-center min-h-screen bg-white  ">
        <div className="flex flex-col  w-11/12  items-center mt-6">
          <Navbar titulito="Ajustes" tamanito={'w-full'} />

          <div className="flex lg:flex-row flex-col w-11/12 justify-around">
            <div className="flex lg:w-3/5 w-11/12 flex-col divide-y mt-16">
              <PersonalInfo til={'Nombre Legal'} nombre={'Wazazin'} accion={'Editar'} />
              <PersonalInfo til={'Correo'} nombre={user.nombre_usuario} accion={'Editar'} />
              <PersonalInfo til={'Numero de telefono'} nombre={'7010-6898'} accion={'Editar'} />
              <PersonalInfo til={'Direccion'} nombre={'Enrique Segobiano'} accion={'Editar'} />
              <PersonalInfo til={'Contacto de emergencia'} nombre={'911'} accion={'Editar'} />
            </div>
            <div className="flex lg:w-1/3 w-11/12  flex-col  items-center">
              <div className="flex flex-col w-10/12 border-x border-y justify-center items-center lg:mt-36 mt-10">
                <div className="w-11/12 mt-4">
                  <img src={ojo} />
                </div>
                <div className="w-11/12">
                  <p className="text-xl font-medium my-4">Seguridad extrema!</p>
                </div>
                <div className="w-11/12 mb-4">
                  <p>
                    En Brainy Bussines la seguridad es lo primordial a la hora de operar el sistema
                  </p>
                </div>
              </div>
              <div className="flex flex-col w-10/12 border-x border-y justify-center items-center">
                <div className="w-11/12 mt-4">
                  <img src={seguro} />
                </div>
                <div className="w-11/12">
                  <p className="text-xl font-medium my-4">Encuentra lo que buscas</p>
                </div>
                <div className="w-11/12 mb-4">
                  <p>
                    En Brainy Bussines puedes visualizar todos tus datos sin restriccion alguna para
                    llegar a tus metas deseadas
                  </p>
                </div>
              </div>
              <div className="flex flex-col w-10/12 border-x border-y justify-center items-center">
                <div className="w-11/12 mt-4">
                  <img src={candado} />
                </div>
                <div className="w-11/12">
                  <p className="text-xl font-medium my-4">Nadie te robara tus datos</p>
                </div>
                <div className="w-11/12 mb-4">
                  <p>
                    En Brainy Bussines la seguridad es lo primordial a la hora de operar el sistema
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
