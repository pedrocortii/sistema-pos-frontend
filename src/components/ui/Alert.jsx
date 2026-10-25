import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const variantesAlerta = {
    error: {
        estilo: "border-red-200 bg-red-50 text-red-700",
        icono: AlertCircle,
        rol: "alert"
    },
    success: {
        estilo: "border-green-200 bg-green-50 text-green-800",
        icono: CheckCircle2,
        rol: "status"
    },
    warning: {
        estilo: "border-amber/40 bg-amber/15 text-ink",
        icono: AlertTriangle,
        rol: "status"
    },
    info: {
        estilo: "border-blue-200 bg-blue-50 text-blue-800",
        icono: Info,
        rol: "status"
    }
};

export function Alert({
    variant = "error",
    tipo,
    titulo,
    texto,
    children,
    icono: IconoCustom,
    className = ""
}) {
    const clave = tipo || variant;
    const config = variantesAlerta[clave] || variantesAlerta.error;
    const Icono = IconoCustom || config.icono;
    const contenido = children ?? texto;

    if (!contenido && !titulo) return null;

    return (
        <div
            role={config.rol}
            className={`flex items-start gap-3 border p-3.5 font-mono-ticket text-sm ${config.estilo} ${className}`}
        >
            {Icono && <Icono size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
            <div className="flex-1">
                {titulo && <p className="font-bold mb-0.5">{titulo}</p>}
                <div>{contenido}</div>
            </div>
        </div>
    );
}

export default Alert;
