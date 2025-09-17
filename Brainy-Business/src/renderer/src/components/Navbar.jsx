import React from 'react'

import Form from '../../../../resources/Form_619.png'
import Icon2 from '../../../../resources/icon-2.png'
import US from '../../../../resources/us.png'
import Flechita from '../../../../resources/Form_1_Kopie.png'
import Avatar from '../../../../resources/avatar_Kopie.png'

import Sidebar from './Sidebar'
import Grafiquita from './Grafiquita'

export default function Navbar({ titulito, tamanito }) {
  return (
    <>
      <div className={`navbar ${tamanito} mt-4`}>
        <div className="drawer w-20 -ml-5">
          <input id="my-drawer" type="checkbox" className="drawer-toggle " />
          <div className="drawer-content">
            <label
              htmlFor="my-drawer"
              className="btn  drawer-button bg-white border-white focus-within:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-5 h-5 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </label>
          </div>
          <div className="drawer-side">
            <label
              htmlFor="my-drawer"
              aria-label="close sidebar"
              className="drawer-overlay"
            ></label>
            <Sidebar />
          </div>
        </div>
        <div className="flex-1">
          <a className="text-3xl font-medium text-slate-700">{titulito}</a>
        </div>
        <div className="flex-none gap-6">
          <img src={US} className="w-5 h-5" />
          <img src={Flechita} className="w-4 h-3 " />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img alt="Tailwind CSS Navbar component" src={Avatar} />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-white rounded-box w-52"
            >
              <li>
                <a className="justify-between">
                  Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li>
                <a href="/ajustes">Settings</a>
              </li>
              <li>
                <a href="/login">Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
