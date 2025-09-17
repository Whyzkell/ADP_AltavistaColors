import React from 'react'
import Brainly from '../../../../resources/Brianly 1.png'
import overview from '../../../../resources/overview.png'
import insights from '../../../../resources/insights.png'
import VerticalBar from '../../../../resources/Chart_Bar_Vertical_01.png'
import ChartLine from '../../../../resources/Chart_Line.png'
import CompararProducto from '../../../../resources/Icon 3.png'
import Mejores from '../../../../resources/Color.png'
import NuevosClientes from '../../../../resources/Trending_Up.png'
import Salir from '../../../../resources/Remove_Minus_Circle.png'

export default function Sidebar() {
  return (
    <>
      <div className="flex flex-col w-80 h-screen items-center justify-between bg-white ">
        <div className="flex flex-col w-full items-center justify-between">
          <div className="flex w-full justify-center py-5">
            <img src={Brainly} className="w-3/4" />
          </div>
          <div className="flex w-3/4 justify-around mt-4 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
            <a href="/">
              <img
                src={overview}
                className="w-6 h-6 hover:scale-110 transition-transform duration-300"
              />
            </a>
            <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
              <a href="/">Inicio</a>
            </p>
          </div>
          <div className="flex w-3/4 justify-around mt-8 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
            <a href="/categorias">
              <img
                src={insights}
                className="w-6 h-6 hover:scale-110 transition-transform duration-300"
              />
            </a>
            <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
              <a href="/categorias">Top Categorias</a>
            </p>
          </div>
          <div className="flex w-3/4 justify-around mt-8 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
            <a href="/productos">
              <img
                src={VerticalBar}
                className="w-6 h-6 hover:scale-110 transition-transform duration-300"
              />
            </a>
            <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
              <a href="/productos">Top Producto</a>
            </p>
          </div>
          <div className="flex w-3/4 justify-around mt-8 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
            <a href="/categorias-comparacion">
              <img
                src={ChartLine}
                className="w-6 h-6 hover:scale-110 transition-transform duration-300"
              />
            </a>
            <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
              <a href="/categorias-comparacion">Comparar Categorias</a>
            </p>
          </div>
          <div className="flex w-3/4 justify-around mt-8 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
            <a href="/productos-comparacion">
              <img
                src={CompararProducto}
                className="w-6 h-6 hover:scale-110 transition-transform duration-300"
              />
            </a>
            <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
              <a href="/productos-comparacion">Comparar Producto</a>
            </p>
          </div>
          <div className="flex w-3/4 justify-around mt-8 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
            <a href="/top-Com-Ven">
              <img
                src={Mejores}
                className="w-5 h-5 hover:scale-110 transition-transform duration-300"
              />
            </a>
            <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
              <a href="/top-Com-Ven">Mejores V/C</a>
            </p>
          </div>
          <div className="flex w-3/4 justify-around mt-8 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
            <a href="/nuevos_clientes">
              <img
                src={NuevosClientes}
                className="w-6 h-6 hover:scale-110 transition-transform duration-300"
              />
            </a>
            <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
              <a href="/nuevos_clientes">Nuevos Clientes</a>
            </p>
          </div>
        </div>
        <div className="flex w-3/4 justify-around mb-8 rounded-lg transition-colors duration-300 focus-within:bg-gray-200">
          <img src={Salir} className="w-6 h-6 hover:scale-110 transition-transform duration-300" />
          <p className="w-8/12 text-slate-600 font-medium hover:text-gray-800 transition-colors duration-300 flex ">
            Salir
          </p>
        </div>
      </div>
    </>
  )
}
