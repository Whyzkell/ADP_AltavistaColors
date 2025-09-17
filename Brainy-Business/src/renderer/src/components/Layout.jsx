
import React from 'react'
import { cx, Button } from './UI.jsx'

export const SidebarLink = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cx('w-full text-left flex items-center gap-3 px-4 py-2 rounded-xl text-sm',
      active ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-neutral-700 hover:bg-neutral-100'
    )}>
    <span className='h-5 w-5 rounded-md bg-neutral-300' />
    {label}
  </button>
)

export const Sidebar = ({ active, setActive }) => (
  <aside className='hidden md:flex md:w-64 flex-col gap-4 border-r bg-white'>
    <div className='px-5 py-6 border-b'>
      <div className='flex items-center gap-3'>
        <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-purple-400' />
        <div className='leading-tight'>
          <p className='text-xs text-neutral-500'>ALTAVISTA</p>
          <p className='text-base font-bold'>COLOR</p>
        </div>
      </div>
    </div>
    <nav className='px-4 flex-1 flex flex-col gap-1'>
      <SidebarLink label='Inicio' active={active==='Inicio'} onClick={()=>setActive('Inicio')} />
      <SidebarLink label='Inventario' active={active==='Inventario'} onClick={()=>setActive('Inventario')} />
      <SidebarLink label='Ventas' active={active==='Ventas'} onClick={()=>setActive('Ventas')} />
      <div className='h-px my-3 bg-neutral-200' />
      <SidebarLink label='Factura' active={active==='Facturas'} onClick={()=>setActive('Facturas')} />
      <SidebarLink label='Crédito Fiscal' active={active==='Crédito Fiscal'} onClick={()=>setActive('Crédito Fiscal')} />
      <div className='h-px my-3 bg-neutral-200' />
      <SidebarLink label='Cuenta' active={active==='Cuenta'} onClick={()=>setActive('Cuenta')} />
      <SidebarLink label='Cerrar Sesión' active={active==='Cerrar Sesión'} onClick={()=>setActive('Cerrar Sesión')} />
    </nav>
    <div className='px-6 py-4 text-xs text-neutral-400'>© 2025</div>
  </aside>
)

export const Topbar = ({ title='ALTAVISTA COLOR' }) => (
  <div className='md:hidden sticky top-0 z-40 bg-white/70 backdrop-blur border-b'>
    <div className='max-w-7xl mx-auto px-4 py-3 flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-purple-400' />
        <span className='text-sm font-semibold'>{title}</span>
      </div>
      <button className='h-9 w-9 rounded-lg ring-1 ring-neutral-300 grid place-items-center'>
        <span className='sr-only'>Menú</span>
        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor'><path strokeWidth='2' d='M4 6h16M4 12h16M4 18h16'/></svg>
      </button>
    </div>
  </div>
)
