const variantes = {
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber/25 text-ink border-amber/40",
    danger: "bg-red-100 text-red-700 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    neutral: "bg-paper text-ink/80 border-line"
};

function resolverVariante(estado, variantProp) {
    if (variantProp) return variantProp;
    if (!estado) return "neutral";

    const limpio = String(estado).toUpperCase().trim();
    if (["COBRADA", "PAGADA", "PAGADO", "CONFIRMADA", "APROBADA", "ACTIVO"].includes(limpio)) {
        return "success";
    }
    if (["PENDIENTE", "EN ESPERA", "PENDIENTE DE PAGO"].includes(limpio)) {
        return "warning";
    }
    if (["CANCELADA", "RECHAZADA", "FALLIDA", "STOCK BAJO", "SIN STOCK", "INACTIVO"].includes(limpio)) {
        return "danger";
    }
    return "neutral";
}

function textoEstado(valor) {
    if (!valor) return valor;
    return String(valor).toLocaleLowerCase("es-AR").replace(/(^|\s)\S/g, function (letra) {
        return letra.toUpperCase();
    });
}

export function Badge({
    children,
    estado,
    variant,
    size = "sm",
    className = ""
}) {
    const texto = textoEstado(children ?? estado);
    const varianteEfectiva = resolverVariante(estado ?? children, variant);
    const estilosVariante = variantes[varianteEfectiva] || variantes.neutral;
    const estilosTamano = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-mono-ticket font-semibold rounded border ${estilosVariante} ${estilosTamano} ${className}`}
        >
            {texto}
        </span>
    );
}

export default Badge;
