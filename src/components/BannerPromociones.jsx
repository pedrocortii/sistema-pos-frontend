import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { formatoMonedaARS } from "../utils/moneda";
import ImagenProducto from "./ImagenProducto";

function formatearDescuento(promocion) {
    const valor = Number(promocion.valorDescuento);
    if (!Number.isFinite(valor)) return null;
    if (promocion.tipoDescuento === "PORCENTAJE") return `${valor}% de descuento`;
    if (promocion.tipoDescuento === "IMPORTE") return `${formatoMonedaARS.format(valor)} de descuento`;
    return null;
}

export default function BannerPromociones({ promociones, cargando = false }) {
    const [indice, setIndice] = useState(0);

    useEffect(function () {
        if (!Array.isArray(promociones) || promociones.length < 2) return undefined;
        const temporizador = window.setInterval(function () {
            setIndice(function (actual) { return (actual + 1) % promociones.length; });
        }, 5000);
        return function () { window.clearInterval(temporizador); };
    }, [promociones]);

    if (cargando) return <p className="mb-8 font-mono-ticket text-xs text-ink/60" role="status">Consultando promociones...</p>;
    if (!Array.isArray(promociones) || promociones.length === 0) return null;

    const indiceVisible = indice >= promociones.length ? 0 : indice;
    const promocion = promociones[indiceVisible] || promociones[0];
    const descuento = formatearDescuento(promocion);
    const productos = (promocion.productos || []).map((item) => item.producto).filter(Boolean);
    const categorias = (promocion.categorias || []).map((item) => item.categoria).filter(Boolean);

    function anterior() { setIndice((indice - 1 + promociones.length) % promociones.length); }
    function siguiente() { setIndice((indice + 1) % promociones.length); }

    return (
        <section className="relative mb-8 overflow-hidden border border-forest/25 bg-forest text-paper" aria-labelledby="titulo-promociones">
            <div className="min-h-64 px-12 py-6 sm:px-16 sm:py-8">
                <div className="flex items-center gap-3">
                    <Tag size={22} className="shrink-0 text-amber" aria-hidden="true" />
                    <p className="font-mono-ticket text-xs uppercase tracking-widest text-paper/70">Promociones vigentes</p>
                </div>
                <div key={promocion.id} className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <h2 id="titulo-promociones" className="font-display text-3xl font-semibold">{promocion.titulo || "Promoción"}</h2>
                        {promocion.descripcion && <p className="mt-2 max-w-2xl text-sm text-paper/80">{promocion.descripcion}</p>}
                        {descuento && <p className="mt-4 font-mono-ticket text-xl font-bold text-amber">{descuento}</p>}
                        {categorias.length > 0 && <p className="mt-2 text-xs text-paper/75">Categorías: {categorias.join(", ")}</p>}
                    </div>
                    {productos.length > 0 && (
                        <div className="flex max-w-xs gap-2" aria-label="Productos incluidos en la promoción">
                            {productos.slice(0, 3).map(function (producto) {
                                return (
                                    <div key={producto.id} className="w-20 sm:w-24">
                                        <div className="aspect-square overflow-hidden rounded border border-paper/25 bg-paper p-1">
                                            <ImagenProducto imagen={producto.imagen} alt={producto.nombre} className="h-full w-full object-contain" />
                                        </div>
                                        <p className="mt-1 truncate text-xs text-paper/80">{producto.nombre}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            {promociones.length > 1 && <>
                <button type="button" onClick={anterior} aria-label="Promoción anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-paper hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-amber"><ChevronLeft size={22} /></button>
                <button type="button" onClick={siguiente} aria-label="Siguiente promoción" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-paper hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-amber"><ChevronRight size={22} /></button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-label="Seleccionar promoción">
                    {promociones.map(function (item, posicion) {
                        return <button key={item.id} type="button" onClick={() => setIndice(posicion)} aria-label={`Mostrar promoción ${posicion + 1}`} aria-current={posicion === indiceVisible ? "true" : undefined} className={`h-2 w-2 rounded-full ${posicion === indiceVisible ? "bg-amber" : "bg-paper/40"}`} />;
                    })}
                </div>
            </>}
        </section>
    );
}
