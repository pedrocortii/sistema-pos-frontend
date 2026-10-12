import { useEffect, useMemo, useState } from "react";
import { Upload, X } from "lucide-react";
import { useProductForm } from "../hooks/useProductForm";
import ImagenProducto from "./ImagenProducto";

function ProductoForm({ producto, alCerrar, alGuardar, guardando }) {
    const [archivoImagen, setArchivoImagen] = useState(null);
    const [errorImagen, setErrorImagen] = useState("");
    const vistaPrevia = useMemo(function () {
        return archivoImagen ? URL.createObjectURL(archivoImagen) : "";
    }, [archivoImagen]);

    useEffect(function () {
        return function () {
            if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
        };
    }, [vistaPrevia]);

    const {
        register,
        handleSubmit,
        errors,
    } = useProductForm(producto, function (datos) {
        alGuardar(datos, archivoImagen);
    });

    function seleccionarImagen(event) {
        const archivo = event.target.files?.[0];
        event.target.value = "";
        if (!archivo) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
            setErrorImagen("Seleccioná una imagen JPG, PNG o WebP.");
            return;
        }
        if (archivo.size > 5 * 1024 * 1024) {
            setErrorImagen("La imagen no puede superar los 5 MB.");
            return;
        }

        setErrorImagen("");
        setArchivoImagen(archivo);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" role="dialog" aria-modal="true" aria-labelledby="producto-form-titulo">
            <form onSubmit={handleSubmit} className="max-h-full w-full max-w-lg overflow-y-auto bg-ticket p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-mono-ticket text-xs uppercase tracking-wide text-forest">Productos</p>
                        <h2 id="producto-form-titulo" className="mt-1 font-display text-2xl">{producto ? "Editar producto" : "Nuevo producto"}</h2>
                    </div>
                    <button type="button" onClick={alCerrar} className="cursor-pointer p-1" aria-label="Cerrar">
                        <X />
                    </button>
                </div>
                <div className="mt-6">
                    <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">Imagen del producto</p>
                    <ImagenProducto
                        imagen={producto?.imagen}
                        vistaPrevia={vistaPrevia}
                        alt={producto ? "Imagen de " + producto.nombre : "Vista previa del producto"}
                        className="mt-2 h-32 w-32 rounded border border-line bg-paper object-cover"
                    />
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-line px-3 py-2 font-mono-ticket text-xs text-ink transition-colors hover:border-forest">
                        <Upload size={15} />
                        {archivoImagen || producto?.imagen ? "Cambiar imagen" : "Subir imagen"}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={seleccionarImagen}
                            className="sr-only"
                        />
                    </label>
                    <p className="mt-1 text-xs text-ink/50">JPG, PNG o WebP; máximo 5 MB.</p>
                    {archivoImagen && <p className="mt-1 truncate text-xs text-ink/60">{archivoImagen.name}</p>}
                    {errorImagen && <p className="mt-1 text-xs text-red-600" role="alert">{errorImagen}</p>}
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Campo etiqueta="Nombre" nombre="nombre" register={register} error={errors.nombre} requerido />
                    <Campo etiqueta="Categoría" nombre="categoria" register={register} error={errors.categoria} requerido />
                    <Campo etiqueta="Precio" nombre="precio" tipo="number" min="0.01" step="0.01" register={register} error={errors.precio} requerido />
                    <Campo etiqueta="Stock inicial" nombre="stock" tipo="number" min="0" step="1" register={register} error={errors.stock} requerido />
                    <label className="sm:col-span-2 font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Descripción
                        <textarea
                            {...register("descripcion")}
                            className="mt-1 min-h-24 w-full border border-line bg-paper p-2 text-sm text-ink outline-none focus:border-forest"
                        />
                        {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>}
                    </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={alCerrar} className="cursor-pointer px-4 py-2 font-mono-ticket text-sm">Cancelar</button>
                    <button disabled={guardando} className="cursor-pointer bg-forest px-4 py-2 font-mono-ticket text-sm text-paper disabled:opacity-60">
                        {guardando ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Campo({ etiqueta, nombre, register, error, tipo = "text", requerido, min, step }) {
    return (
        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
            {etiqueta}
            <input
                type={tipo}
                min={min}
                step={step}
                required={requerido}
                {...register(nombre)}
                className="mt-1 w-full border border-line bg-paper p-2 text-sm text-ink outline-none focus:border-forest"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
        </label>
    );
}

export default ProductoForm;
