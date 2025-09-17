
import React from 'react'

export const cx = (...c) => c.filter(Boolean).join(' ')

export const Card = ({ className = '', children }) => (
  <div className={cx('bg-white rounded-2xl ring-1 ring-neutral-200', className)}>{children}</div>
)

export const Button = ({ children, variant='primary', className='', ...props }) => {
  const base = 'inline-flex items-center gap-2 justify-center px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-[.98]'
  const styles = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
    ghost: 'bg-transparent text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50',
    soft: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100',
    danger: 'bg-rose-500 text-white hover:bg-rose-600'
  }
  return <button className={cx(base, styles[variant], className)} {...props}>{children}</button>
}

export const Pill = ({ children, intent='success' }) => {
  const variants = {
    success: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    warn: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
    neutral: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
  }
  return <span className={cx('px-3 py-1 rounded-full text-xs font-semibold', variants[intent])}>{children}</span>
}

export const MoneyPill = ({ amount }) => (
  <span className='px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200'>${amount}</span>
)

export const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={onClose} />
      <div className='absolute inset-0 flex items-start justify-center pt-24 px-4 sm:px-6'>
        <div className='w-full max-w-3xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200'>
          <div className='p-6 sm:p-8'>
            <h3 className='text-2xl font-bold'>{title}</h3>
            <div className='mt-1 h-1 w-20 bg-neutral-900 rounded' />
            <div className='mt-6'>{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
