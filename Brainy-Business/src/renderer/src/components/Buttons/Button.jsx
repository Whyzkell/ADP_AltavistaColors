import React from 'react'

const styles = {
  primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
  soft: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100',
  ghost: 'bg-transparent text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50'
}

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 justify-center px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-[.98] ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
