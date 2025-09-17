import React, { useState } from "react";
import ClipIcon from "../../assets/Icons/clip.png";

const InputSubidArchivo = ({ label, name, id }) => {
  const [fileName, setFileName] = useState("No se ha elegido ningún archivo");

  const handleChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("No se ha elegido ningún archivo");
    }
  };

  return (
    <div>
      <label className="block text-[#27426E] font-medium text-[18px] mb-3">
        {label}
      </label>

      <div className="flex items-center w-full h-[52px] px-4 py-2 rounded-[16px] bg-indigo-50 focus-within:shadow-md cursor-pointer">
        <div className="flex justify-between w-full items-center">
          {/* Texto que muestra el nombre o mensaje por defecto */}
          <span className="text-gray-500 text-[13px] truncate">{fileName}</span>

          {/* Label que actúa como botón */}

          <label htmlFor={id}>
            <img
              htmlFor={id}
              src={ClipIcon}
              alt="Clip Icon"
              className="h-5 w-5 mr-2"
            />
          </label>
        </div>

        {/* Input oculto */}
        <input
          type="file"
          name={name}
          id={id}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default InputSubidArchivo;
