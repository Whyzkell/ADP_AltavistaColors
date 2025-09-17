import React from "react";

const InputconTituloForms = ({
  label,
  placeholder,
  name,
  type,
  id,
  value,
  onChange,
}) => (
  <div>
    <label className="block text-[#27426E] font-medium text-[18px] mb-3">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full h-[52px] px-4 py-2 rounded-[16px] bg-indigo-50 focus:outline-none focus:shadow-md "
    />
  </div>
);

export default InputconTituloForms;
