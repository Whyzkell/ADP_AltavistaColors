import React from 'react'

const variants = {
  success: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  warn: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  neutral: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200'
}

export default function Pill({ children, intent = 'success', className = '' }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[intent]} ${className}`}
    >
      {children}
    </span>
  )
}
