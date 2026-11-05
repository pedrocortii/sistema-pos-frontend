export function Pagination({
    pagina,
    total,
    cambiar,
    textoAnterior = "Anterior",
    textoSiguiente = "Siguiente",
    className = ""
}) {
    if (!total || total <= 1) return null;

    return (
        <nav
            aria-label="Paginación"
            className={`mt-6 flex items-center justify-center gap-4 font-mono-ticket text-sm ${className}`}
        >
            <button
                type="button"
                disabled={pagina <= 1}
                onClick={function () {
                    cambiar(pagina - 1);
                }}
                className="cursor-pointer text-forest underline disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
            >
                {textoAnterior}
            </button>

            <span className="text-ink/70">
                Página {pagina} de {total}
            </span>

            <button
                type="button"
                disabled={pagina >= total}
                onClick={function () {
                    cambiar(pagina + 1);
                }}
                className="cursor-pointer text-forest underline disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
            >
                {textoSiguiente}
            </button>
        </nav>
    );
}

export default Pagination;
