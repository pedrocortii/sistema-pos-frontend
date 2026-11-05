import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
    etiqueta,
    titulo,
    descripcion,
    volverA,
    textoVolver = "Volver",
    acciones,
    children,
    className = ""
}) {
    return (
        <header className={`mb-6 ${className}`}>
            {volverA && (
                <Link
                    to={volverA}
                    className="inline-flex items-center gap-1.5 mb-3 text-xs text-forest hover:underline"
                >
                    <ArrowLeft size={15} aria-hidden="true" />
                    <span>{textoVolver}</span>
                </Link>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    {etiqueta && (
                        <p className="text-xs text-forest">
                            {etiqueta}
                        </p>
                    )}
                    {titulo && (
                        <h1 className="mt-1 font-display text-3xl sm:text-4xl text-ink">
                            {titulo}
                        </h1>
                    )}
                    {descripcion && (
                        <p className="mt-1 text-sm text-ink/60">
                            {descripcion}
                        </p>
                    )}
                </div>

                {acciones && <div className="flex items-center gap-3 shrink-0">{acciones}</div>}
            </div>

            {children && <div className="mt-4">{children}</div>}
        </header>
    );
}

export default PageHeader;
