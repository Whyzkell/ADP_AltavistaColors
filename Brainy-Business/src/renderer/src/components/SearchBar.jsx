
import React from 'react'
import { Button } from './UI.jsx'

export default function SearchBar({ query, setQuery, addLabel='Agregar', onAdd }){
  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white'>
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder='Buscar' className='outline-none text-sm bg-transparent w-44'/>
        <button className='grid place-items-center h-7 w-7 rounded-full hover:bg-neutral-100'>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor'><circle cx='11' cy='11' r='7'/><path d='M20 20l-3-3'/></svg>
        </button>
      </div>
      <Button variant='soft' onClick={onAdd}>{addLabel}</Button>
    </div>
  )
}
