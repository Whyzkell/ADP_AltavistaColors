import React from 'react'

export default function Topbar({ title = 'ALTAVISTA COLOR' }) {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-purple-400" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <button className="h-9 w-9 rounded-lg ring-1 ring-neutral-300 grid place-items-center">
          <span className="sr-only">Menú</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
