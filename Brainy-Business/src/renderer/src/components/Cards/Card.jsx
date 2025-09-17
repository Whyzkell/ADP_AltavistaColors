import React from 'react'

export default function Card({ className = '', children }) {
  return (
    <div className={`bg-white rounded-2xl ring-1 ring-neutral-200 ${className}`}>{children}</div>
  )
}
