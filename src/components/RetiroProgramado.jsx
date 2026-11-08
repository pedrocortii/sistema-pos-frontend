import { CalendarClock } from "lucide-react";
import { obtenerHorarioRetiro } from "../utils/retiro";

export function RetiroProgramado({ venta, compacto = false, className = "" }) {
    const horario = obtenerHorarioRetiro(venta);
    if (!horario) return null;

    return (
        <div className={`flex items-start gap-1.5 ${className}`}>
            <CalendarClock size={14} className="mt-0.5 shrink-0 text-forest" aria-hidden="true" />
            <div className={compacto ? "text-xs" : "text-sm"}>
                <p>
                    <span className="font-semibold">Fecha de retiro:</span> {horario.fecha}
                </p>
                <p>
                    <span className="font-semibold">Horario:</span> {horario.horaInicio} a {horario.horaFin}
                </p>
            </div>
        </div>
    );
}
