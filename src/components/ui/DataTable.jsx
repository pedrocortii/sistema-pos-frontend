import { CargaAdmin } from "../AdminUI";
import { Alert } from "./Alert";
import { Table } from "./Table";

/**
 * Componente wrapper para tablas de datos administrativas.
 * Gestiona los estados de carga, error y vacío, reduciendo el boilerplate en las páginas.
 */
export function DataTable({
    isLoading,
    error,
    children,
    className = "",
    minWidth = "min-w-175",
}) {
    if (error) {
        return <Alert tipo="error" texto={error} className="mb-4" />;
    }

    if (isLoading) {
        return <CargaAdmin />;
    }

    return (
        <Table minWidth={minWidth} className={className}>
            {children}
            {/*
               Nota: DataTable no renderiza el TableEmpty automáticamente
               porque el TableEmpty debe ir dentro del TableBody,
               y los children suelen incluir el TableHeader y TableBody.
               Sin embargo, el componente TableEmpty ya existe en ui/Table.jsx.
            */}
        </Table>
    );
}
