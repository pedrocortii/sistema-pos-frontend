function claveFecha(fecha) {
    if (!fecha) return "";
    if (typeof fecha === "string") return fecha.slice(0, 10);
    const fechaNormalizada = new Date(fecha);
    return Number.isNaN(fechaNormalizada.getTime()) ? "" : fechaNormalizada.toISOString().slice(0, 10);
}

export function formatearFechaRetiro(fecha, incluirDia = false) {
    const fechaIso = claveFecha(fecha);
    if (!fechaIso) return "";
    const fechaUtc = new Date(`${fechaIso}T00:00:00.000Z`);
    return new Intl.DateTimeFormat("es-AR", {
        timeZone: "UTC",
        ...(incluirDia && { weekday: "long" }),
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(fechaUtc);
}

export function obtenerHorarioRetiro(venta) {
    if (!venta?.fechaRetiro || !venta.horarioRetiroInicio || !venta.horarioRetiroFin) return null;
    return {
        fecha: formatearFechaRetiro(venta.fechaRetiro),
        horaInicio: venta.horarioRetiroInicio,
        horaFin: venta.horarioRetiroFin
    };
}
