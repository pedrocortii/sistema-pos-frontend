import { Minus, Plus } from "lucide-react";

function SelectorCantidad({ cantidad, onCambiar, maximo }) {
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={function () { onCambiar(Math.max(1, cantidad - 1)); }}
                disabled={cantidad <= 1}
                aria-label="Disminuir cantidad"
                className="w-9 h-9 border border-line text-ink flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <Minus size={16} />
            </button>
            <span className="font-mono-ticket text-lg w-6 text-center" aria-label={`Cantidad: ${cantidad}`}>
                {cantidad}
            </span>
            <button
                type="button"
                onClick={function () { onCambiar(Math.min(maximo, cantidad + 1)); }}
                disabled={cantidad >= maximo}
                aria-label="Aumentar cantidad"
                className="w-9 h-9 border border-line text-ink flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}

export default SelectorCantidad;
