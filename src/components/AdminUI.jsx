import MensajeCarga from "./MensajeCarga";
import MensajeError from "./MensajeError";

export function CabeceraAdmin({ etiqueta, titulo }) {
    return (
        <>
            <p className="font-mono-ticket text-xs uppercase tracking-[.25em] text-forest">{etiqueta}</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">{titulo}</h1>
        </>
    );
}

export function CargaAdmin() {
    return <MensajeCarga className="mt-8" />;
}

export function AlertaAdmin({ texto }) {
    return <MensajeError texto={texto} className="mt-4" />;
}

export function PaginacionAdmin({ pagina, total, cambiar }) {
    return (
        total > 1 && (
            <div className="mt-6 flex justify-center gap-4 font-mono-ticket text-sm">
                <button disabled={pagina === 1} onClick={function () { cambiar(pagina - 1); }} className="cursor-pointer text-forest disabled:opacity-30">
                    Anterior
                </button>
                <span>{pagina} / {total}</span>
                <button disabled={pagina === total} onClick={function () { cambiar(pagina + 1); }} className="cursor-pointer text-forest disabled:opacity-30">
                    Siguiente
                </button>
            </div>
        )
    );
}

export function EstadoVenta({ estado }) {
    const color =
        estado === "COBRADA"
            ? "bg-green-100 text-green-700"
            : estado === "CANCELADA"
            ? "bg-red-100 text-red-700"
            : "bg-amber/30 text-ink";
    return <span className={"rounded px-2 py-1 font-mono-ticket text-xs " + color}>{estado}</span>;
}
