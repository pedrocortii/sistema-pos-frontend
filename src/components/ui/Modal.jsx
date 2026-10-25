import { useEffect } from "react";
import { X } from "lucide-react";

const anchosModal = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl"
};

export function Modal({
    abierto = true,
    alCerrar,
    etiqueta,
    titulo,
    descripcion,
    tamano = "md",
    children,
    footer,
    className = ""
}) {
    useEffect(function () {
        if (!abierto) return;

        function manejarEscape(e) {
            if (e.key === "Escape" && alCerrar) {
                alCerrar();
            }
        }

        window.addEventListener("keydown", manejarEscape);
        return function () {
            window.removeEventListener("keydown", manejarEscape);
        };
    }, [abierto, alCerrar]);

    if (!abierto) return null;

    const maxAncho = anchosModal[tamano] || anchosModal.md;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titulo ? "modal-titulo" : undefined}
            onClick={function (e) {
                if (e.target === e.currentTarget && alCerrar) {
                    alCerrar();
                }
            }}
        >
            <div
                className={`relative w-full ${maxAncho} max-h-[90vh] overflow-y-auto bg-ticket p-6 shadow-2xl border border-line ${className}`}
            >
                {(titulo || etiqueta || alCerrar) && (
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
                        <div>
                            {etiqueta && (
                                <p className="font-mono-ticket text-xs text-forest">
                                    {etiqueta}
                                </p>
                            )}
                            {titulo && (
                                <h2 id="modal-titulo" className="mt-1 font-display text-2xl text-ink">
                                    {titulo}
                                </h2>
                            )}
                            {descripcion && (
                                <p className="mt-1 font-mono-ticket text-xs text-ink/60">
                                    {descripcion}
                                </p>
                            )}
                        </div>
                        {alCerrar && (
                            <button
                                type="button"
                                onClick={alCerrar}
                                className="cursor-pointer p-1 text-ink/60 hover:text-ink transition-colors"
                                aria-label="Cerrar modal"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}

                <div className="mt-4">{children}</div>

                {footer && (
                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-line">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
