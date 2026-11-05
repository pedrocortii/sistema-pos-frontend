/**
 * Componente para organizar la barra de filtros en las páginas de administración.
 * Proporciona un layout consistente (grid) para los controles de búsqueda y filtrado.
 */
export function FilterBar({
    children,
    className = "",
}) {
    return (
        <div className={`mt-4 mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
            {children}
        </div>
    );
}
