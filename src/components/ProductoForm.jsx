import { useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { useProductForm } from "../hooks/useProductForm";
import ImagenProducto from "./ImagenProducto";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";

function ProductoForm({ producto, alCerrar, alGuardar, guardando, error }) {
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
        <Modal
            abierto={true}
            alCerrar={alCerrar}
            etiqueta="Productos"
            titulo={producto ? "Editar producto" : "Nuevo producto"}
            tamano="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <Alert tipo="error" texto={error} />}

                <div>
                    <p className="font-mono-ticket text-xs text-ink/60">Imagen del producto</p>
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
                    <p className="mt-1 text-xs text-ink/50 font-mono-ticket">JPG, PNG o WebP; máximo 5 MB.</p>
                    {archivoImagen && <p className="mt-1 truncate text-xs text-ink/60 font-mono-ticket">{archivoImagen.name}</p>}
                    {errorImagen && <p className="mt-1 text-xs text-red-600 font-mono-ticket" role="alert">{errorImagen}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Nombre"
                        required
                        {...register("nombre")}
                        error={errors.nombre}
                    />
                    <Input
                        label="Categoría"
                        required
                        {...register("categoria")}
                        error={errors.categoria}
                    />
                    <Input
                        label="Precio"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        {...register("precio")}
                        error={errors.precio}
                    />
                    <Input
                        label="Stock inicial"
                        type="number"
                        min="0"
                        step="1"
                        required
                        {...register("stock")}
                        error={errors.stock}
                    />
                    <div className="sm:col-span-2">
                        <Textarea
                            label="Descripción"
                            rows={3}
                            {...register("descripcion")}
                            error={errors.descripcion}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-line">
                    <Button variant="secondary" onClick={alCerrar}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={guardando} loadingText="Guardando...">
                        Guardar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default ProductoForm;
