import { useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { useProductForm } from "../hooks/useProductForm";
import ImagenProducto from "./ImagenProducto";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";

function ProductoForm({ producto, alCerrar, alGuardar, guardando, error, categorias = [], tiposProducto = [], errorClasificacion }) {
    const [archivoImagen, setArchivoImagen] = useState(null);
    const [errorImagen, setErrorImagen] = useState("");
    const vistaPrevia = useMemo(() => archivoImagen ? URL.createObjectURL(archivoImagen) : "", [archivoImagen]);
    useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia); }, [vistaPrevia]);
    const { register, handleSubmit, errors } = useProductForm(producto, (datos) => alGuardar(datos, archivoImagen));

    function seleccionarImagen(event) {
        const archivo = event.target.files?.[0];
        event.target.value = "";
        if (!archivo) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) return setErrorImagen("Seleccioná una imagen JPG, PNG o WebP.");
        if (archivo.size > 5 * 1024 * 1024) return setErrorImagen("La imagen no puede superar los 5 MB.");
        setErrorImagen(""); setArchivoImagen(archivo);
    }

    return <Modal abierto={true} alCerrar={alCerrar} etiqueta="Productos" titulo={producto ? "Editar producto" : "Nuevo producto"} tamano="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert tipo="error" texto={error} />}
            <div>
                <p className="font-mono-ticket text-xs text-ink/60">Imagen del producto</p>
                <ImagenProducto imagen={producto?.imagen} vistaPrevia={vistaPrevia} alt={producto ? "Imagen de " + producto.nombre : "Vista previa del producto"} className="mt-2 h-32 w-32 rounded border border-line bg-paper object-cover" />
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-line px-3 py-2 font-mono-ticket text-xs text-ink"><Upload size={15} />{archivoImagen || producto?.imagen ? "Cambiar imagen" : "Subir imagen"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={seleccionarImagen} className="sr-only" /></label>
                {errorImagen && <p className="mt-1 text-xs text-red-600" role="alert">{errorImagen}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nombre" required {...register("nombre")} error={errors.nombre} />
                <Select label="Categoría" required options={[{ value: "", label: "Seleccioná una categoría" }, ...categorias.map((item) => ({ value: item.id, label: item.nombre }))]} {...register("categoriaId")} error={errors.categoriaId} disabled={Boolean(errorClasificacion) || !categorias.length} />
                <Select label="Tipo de producto" required options={[{ value: "", label: "Seleccioná un tipo" }, ...tiposProducto.map((item) => ({ value: item.id, label: item.nombre }))]} {...register("tipoProductoId")} error={errors.tipoProductoId} disabled={Boolean(errorClasificacion) || !tiposProducto.length} />
                <Input label="Precio" type="number" min="0.01" step="0.01" required {...register("precio")} error={errors.precio} />
                <Input label="Stock inicial" type="number" min="0" step="1" required {...register("stock")} error={errors.stock} />
                <div className="sm:col-span-2"><Textarea label="Descripción" rows={3} {...register("descripcion")} error={errors.descripcion} /></div>
            </div>
            {errorClasificacion && <Alert tipo="error" texto={errorClasificacion} />}
            <div className="flex justify-end gap-3 border-t border-line pt-3"><Button variant="secondary" onClick={alCerrar}>Cancelar</Button><Button type="submit" loading={guardando} loadingText="Guardando...">Guardar</Button></div>
        </form>
    </Modal>;
}

export default ProductoForm;
