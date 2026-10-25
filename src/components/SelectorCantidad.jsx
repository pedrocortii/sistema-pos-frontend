import { Minus, Plus } from "lucide-react";

export function SelectorCantidad({
    cantidad,
    onCambiar,
    minimo = 1,
    maximo,
    disabled = false,
    size = "md",
    className = ""
}) {
    const esSm = size === "sm";
    const botonClase = esSm
        ? "w-8 h-8 border border-line text-ink flex items-center justify-center transition-colors hover:bg-forest/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        : "w-9 h-9 border border-line text-ink flex items-center justify-center transition-colors hover:bg-forest/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer";

    const textoClase = esSm
        ? "font-mono-ticket text-xl w-7 text-center text-ink leading-none select-none"
        : "font-mono-ticket text-lg w-6 text-center text-ink leading-none select-none";

    const sePuedeDisminuir = !disabled && cantidad > minimo;
    const sePuedeAumentar = !disabled && (maximo === undefined || cantidad < maximo);

    function decrementar() {
        if (!sePuedeDisminuir) return;
        onCambiar(Math.max(minimo, cantidad - 1));
    }

    function incrementar() {
        if (!sePuedeAumentar) return;
        const nuevo = cantidad + 1;
        onCambiar(maximo !== undefined ? Math.min(maximo, nuevo) : nuevo);
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <button
                type="button"
                onClick={decrementar}
                disabled={!sePuedeDisminuir}
                aria-label="Disminuir cantidad"
                className={botonClase}
            >
                <Minus size={esSm ? 14 : 16} />
            </button>
            <span className={textoClase} aria-label={`Cantidad: ${cantidad}`}>
                {cantidad}
            </span>
            <button
                type="button"
                onClick={incrementar}
                disabled={!sePuedeAumentar}
                aria-label="Aumentar cantidad"
                className={botonClase}
            >
                <Plus size={esSm ? 14 : 16} />
            </button>
        </div>
    );
}

export default SelectorCantidad;
