export function Table({ children, className = "", minWidth = "min-w-175", containerClassName = "" }) {
    return (
        <div className={`overflow-x-auto border border-line bg-ticket ${containerClassName}`}>
            <table className={`w-full ${minWidth} text-left ${className}`}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children, className = "" }) {
    return (
        <thead className={`border-b border-line bg-paper text-xs text-ink/60 ${className}`}>
            {children}
        </thead>
    );
}

export function TableBody({ children, className = "" }) {
    return <tbody className={`divide-y divide-line ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = "", hover = true }) {
    return (
        <tr
            className={`border-b border-line last:border-0 ${hover ? "hover:bg-paper/40 transition-colors" : ""} ${className}`}
        >
            {children}
        </tr>
    );
}

export function TableHead({ children, className = "" }) {
    return <th className={`p-3 font-medium ${className}`}>{children}</th>;
}

export function TableCell({ children, className = "" }) {
    return <td className={`p-3 text-sm text-ink ${className}`}>{children}</td>;
}

export function TableEmpty({ mensaje = "No se encontraron resultados.", colSpan, className = "" }) {
    if (colSpan) {
        return (
            <tr>
                <td colSpan={colSpan} className={`p-6 text-center text-sm text-ink/60 ${className}`}>
                    {mensaje}
                </td>
            </tr>
        );
    }
    return <p className={`p-5 text-sm text-ink/60 ${className}`}>{mensaje}</p>;
}

export default Table;
