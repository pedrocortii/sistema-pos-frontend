import MensajeCarga from "./MensajeCarga";
import { Alert } from "./ui/Alert";
import { Badge } from "./ui/Badge";
import { Pagination } from "./ui/Pagination";
import { PageHeader } from "./ui/PageHeader";

export function CabeceraAdmin({ etiqueta, titulo, descripcion, acciones, volverA, textoVolver }) {
    return (
        <PageHeader
            etiqueta={etiqueta}
            titulo={titulo}
            descripcion={descripcion}
            acciones={acciones}
            volverA={volverA}
            textoVolver={textoVolver}
            className="mb-0"
        />
    );
}

export function CargaAdmin({ texto }) {
    return <MensajeCarga texto={texto} className="mt-8" />;
}

export function AlertaAdmin({ texto, tipo = "error", titulo }) {
    return <Alert tipo={tipo} titulo={titulo} texto={texto} className="mt-4" />;
}

export function PaginacionAdmin({ pagina, total, cambiar }) {
    return <Pagination pagina={pagina} total={total} cambiar={cambiar} />;
}

export function EstadoVenta({ estado }) {
    return <Badge estado={estado} />;
}

export default {
    CabeceraAdmin,
    CargaAdmin,
    AlertaAdmin,
    PaginacionAdmin,
    EstadoVenta
};
