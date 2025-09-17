import React from 'react'

const SubmitButtonAzul = ({ texto, onClick, type = 'submit' }) => {
  return (
    <button
      type="submit"
      onClick={onClick}
      className="w-full py-3 rounded-xl bg-[#E2F0CB] text-black  font-bold shadow-md hover:opacity-90 transition"
    >
      {texto}
    </button>
  )
}

export default SubmitButtonAzul
