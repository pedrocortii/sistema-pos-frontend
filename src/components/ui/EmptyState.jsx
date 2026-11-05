export function EmptyState({
    icono: Icono,
    titulo,
    descripcion,
    accion,
    className = ""
}) {
    return (
        <div className={`py-12 px-4 text-center flex flex-col items-center justify-center ${className}`}>
            {Icono && (
                <div className="w-12 h-12 rounded-full bg-paper border border-line flex items-center justify-center text-ink/50 mb-4">
                    <Icono size={22} aria-hidden="true" />
                </div>
            )}
            {titulo && (
                <h3 className="font-display text-xl text-ink mb-1">
                    {titulo}
                </h3>
            )}
            {descripcion && (
                <p className="font-mono-ticket text-sm text-ink/60 max-w-sm mb-6">
                    {descripcion}
                </p>
            )}
            {accion && <div>{accion}</div>}
        </div>
    );
}

export default EmptyState;
