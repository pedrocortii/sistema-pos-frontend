import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { descargarComprobante } from "../api/ventas";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";

export function DescargarComprobante({ ventaId, codigoComprobante, className = "" }) {
    const [descargando, setDescargando] = useState(false);
    const [error, setError] = useState(null);
    const solicitudEnCurso = useRef(false);

    async function manejarDescarga() {
        if (solicitudEnCurso.current) return;

        solicitudEnCurso.current = true;
        setDescargando(true);
        setError(null);
        try {
            await descargarComprobante(ventaId, codigoComprobante);
        } catch {
            setError("No se pudo generar el comprobante. Intentá nuevamente.");
        } finally {
            solicitudEnCurso.current = false;
            setDescargando(false);
        }
    }

    return (
        <div className={className}>
            <Button
                variant="outline"
                size="sm"
                icon={FileDown}
                onClick={manejarDescarga}
                loading={descargando}
                loadingText="Generando PDF..."
                className="w-full sm:w-auto"
            >
                Descargar comprobante
            </Button>
            {error && <Alert tipo="error" texto={error} className="mt-3" />}
        </div>
    );
}
