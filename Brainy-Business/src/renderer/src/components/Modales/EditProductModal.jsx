// EditProductModal.jsx
import React, { useEffect, useState } from "react";

/* Usa tu Modal global si ya lo tienes */
function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-24 px-4 sm:px-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-bold">{title}</h3>
            <div className="mt-2 h-1 w-20 bg-neutral-900 rounded" />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function InputGreen({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={
        "w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 placeholder-neutral-400 outline-none " +
        className
      }
    />
  );
}

export default function EditProductModal({ open, onClose, product, onSave }) {
  const [f, setF] = useState({
    id: "",
    nombre: "",
    categoria: "",
    precio: "",
    codigo: "",
    existencias: "",
  });

  // Prefill cuando abra o cambie producto
  useEffect(() => {
    if (product) {
      setF({
        id: product.id ?? "",
        nombre: product.nombre ?? "",
        categoria: product.categoria ?? "",
        precio: product.precio ?? "",
        codigo: product.codigo ?? "",
        existencias: product.existencias ?? "",
      });
    }
  }, [product, open]);

  const onChange = (e) => {
    const { id, value } = e.target;
    setF((s) => ({ ...s, [id]: value }));
  };

  const submit = (e) => {
    e.preventDefault();

    if (!f.nombre.trim()) return alert("Ingresa el nombre");
    if (!f.categoria.trim()) return alert("Ingresa la categoría");

    const precio = Number(f.precio);
    const codigo = Number(f.codigo);
    const existencias = Number(f.existencias);

    if (!isFinite(precio) || precio < 0) return alert("Precio inválido");
    if (!Number.isInteger(codigo) || codigo <= 0) return alert("Código inválido");
    if (!Number.isInteger(existencias) || existencias < 0) return alert("Existencias inválidas");

    const updated = {
      id: f.id, // conservamos el ID
      nombre: f.nombre.trim(),
      categoria: f.categoria.trim(),
      precio,
      codigo,
      existencias,
    };

    onSave?.(updated);
    onClose?.();
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar producto">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ID">
            <InputGreen value={f.id} readOnly />
          </Field>
          <Field label="Nombre">
            <InputGreen id="nombre" value={f.nombre} onChange={onChange} required />
          </Field>
          <Field label="Categoría">
            <InputGreen id="categoria" value={f.categoria} onChange={onChange} required />
          </Field>
          <Field label="Precio">
            <InputGreen
              id="precio"
              type="number"
              min="0"
              step="0.01"
              value={f.precio}
              onChange={onChange}
              required
            />
          </Field>
          <Field label="Código">
            <InputGreen
              id="codigo"
              type="number"
              min="1"
              step="1"
              value={f.codigo}
              onChange={onChange}
              required
            />
          </Field>
          <Field label="Existencias">
            <InputGreen
              id="existencias"
              type="number"
              min="0"
              step="1"
              value={f.existencias}
              onChange={onChange}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600"
          >
            Guardar Cambios
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
