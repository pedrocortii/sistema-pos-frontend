/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const vacio = { nombre: "", descripcion: "", precio: "", stock: "", categoria: "" };

function ProductoForm({ producto, alCerrar, alGuardar, guardando }) {
    const [datos, setDatos] = useState(vacio);
    const [error, setError] = useState("");

    useEffect(function () {
        setDatos(producto ? { nombre: producto.nombre, descripcion: producto.descripcion || "", precio: String(producto.precio), stock: String(producto.stock), categoria: producto.categoria } : vacio);
        setError("");
    }, [producto]);

    function actualizar(campo, valor) { setDatos(function (actual) { return { ...actual, [campo]: valor }; }); }
    function enviar(evento) {
        evento.preventDefault();
        const precio = Number(datos.precio);
        const stock = Number(datos.stock);
        if (!datos.nombre.trim() || !datos.categoria.trim() || !Number.isFinite(precio) || precio <= 0 || !Number.isInteger(stock) || stock < 0) {
            setError("Completá los campos obligatorios con un precio positivo y un stock entero igual o mayor a cero.");
            return;
        }
        alGuardar({ nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim() || undefined, precio, stock, categoria: datos.categoria.trim() });
    }

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" role="dialog" aria-modal="true" aria-labelledby="producto-form-titulo">
        <form onSubmit={enviar} className="max-h-full w-full max-w-lg overflow-y-auto bg-ticket p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4"><div><p className="font-mono-ticket text-xs uppercase tracking-wide text-forest">Productos</p><h2 id="producto-form-titulo" className="mt-1 font-display text-2xl">{producto ? "Editar producto" : "Nuevo producto"}</h2></div><button type="button" onClick={alCerrar} className="cursor-pointer p-1" aria-label="Cerrar"><X /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nombre" valor={datos.nombre} alCambiar={function (v) { actualizar("nombre", v); }} requerido />
                <Campo etiqueta="Categoría" valor={datos.categoria} alCambiar={function (v) { actualizar("categoria", v); }} requerido />
                <Campo etiqueta="Precio" tipo="number" min="0.01" step="0.01" valor={datos.precio} alCambiar={function (v) { actualizar("precio", v); }} requerido />
                <Campo etiqueta="Stock inicial" tipo="number" min="0" step="1" valor={datos.stock} alCambiar={function (v) { actualizar("stock", v); }} requerido />
                <label className="sm:col-span-2 font-mono-ticket text-xs uppercase tracking-wide text-ink/60">Descripción<textarea value={datos.descripcion} onChange={function (e) { actualizar("descripcion", e.target.value); }} className="mt-1 min-h-24 w-full border border-line bg-paper p-2 text-sm text-ink outline-none focus:border-forest" /></label>
            </div>
            {error && <p className="mt-4 font-mono-ticket text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={alCerrar} className="cursor-pointer px-4 py-2 font-mono-ticket text-sm">Cancelar</button><button disabled={guardando} className="cursor-pointer bg-forest px-4 py-2 font-mono-ticket text-sm text-paper disabled:opacity-60">{guardando ? "Guardando..." : "Guardar"}</button></div>
        </form>
    </div>;
}

function Campo({ etiqueta, valor, alCambiar, tipo = "text", requerido, min, step }) { return <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">{etiqueta}<input type={tipo} min={min} step={step} required={requerido} value={valor} onChange={function (e) { alCambiar(e.target.value); }} className="mt-1 w-full border border-line bg-paper p-2 text-sm text-ink outline-none focus:border-forest" /></label>; }
export default ProductoForm;
