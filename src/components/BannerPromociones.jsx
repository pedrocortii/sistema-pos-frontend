import { Tag } from "lucide-react";
import { formatoMonedaARS } from "../utils/moneda";

function formatearDescuento(promocion) {
    const valor = Number(promocion.valorDescuento);
    if (!Number.isFinite(valor)) return null;
    if (promocion.tipoDescuento === "PORCENTAJE") return `${valor}% de descuento`;
    if (promocion.tipoDescuento === "IMPORTE") return `${formatoMonedaARS.format(valor)} de descuento`;
    return null;
}

function obtenerAlcance(promocion) {
    const productos = (promocion.productos || []).map((item) => item.producto?.nombre).filter(Boolean);
    const categorias = (promocion.categorias || []).map((item) => item.categoria).filter(Boolean);
    if (productos.length) return `Productos: ${productos.join(", ")}`;
    if (categorias.length) return `Categorías: ${categorias.join(", ")}`;
    return null;
}

export default function BannerPromociones({ promociones, cargando = false }) {
    if (cargando) {
        return <p className="mb-8 font-mono-ticket text-xs text-ink/60" role="status">Consultando promociones...</p>;
    }
    if (!Array.isArray(promociones) || promociones.length === 0) return null;

    return (
        <section className="mb-8 border border-forest/25 bg-forest px-5 py-5 text-paper sm:px-6" aria-labelledby="titulo-promociones">
            <div className="flex items-start gap-3">
                <Tag size={22} className="mt-1 shrink-0 text-amber" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <h2 id="titulo-promociones" className="font-display text-xl font-semibold">Promociones vigentes</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {promociones.map((promocion) => {
                            const descuento = formatearDescuento(promocion);
                            const alcance = obtenerAlcance(promocion);
                            return (
                                <article key={promocion.id} className="border border-paper/25 bg-paper/10 p-4">
                                    <h3 className="font-display text-lg font-semibold">{promocion.titulo || "Promoción"}</h3>
                                    {promocion.descripcion && <p className="mt-1 text-sm text-paper/80">{promocion.descripcion}</p>}
                                    {descuento && <p className="mt-3 font-mono-ticket text-sm font-bold text-amber">{descuento}</p>}
                                    {alcance && <p className="mt-2 text-xs text-paper/75">{alcance}</p>}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
