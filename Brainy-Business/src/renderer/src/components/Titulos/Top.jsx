import React from 'react'

export default function Top({ titulon }) {
  return (
    <>
      <div className="flex justify-between w-full my-4">
        <p className="text-2xl font-medium text-slate-700">{titulon}</p>
        <div className="flex justify-around items-center">
          <div className="h-2 w-2 bg-slate-400 rounded-full mx-1" />{' '}
          <div className=" h-2 w-2 bg-slate-400 rounded-full mr-1" />{' '}
          <div className="h-2 w-2 bg-slate-400 rounded-full mr-1" />{' '}
        </div>
      </div>
    </>
  )
}
