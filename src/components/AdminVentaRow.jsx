import { TableCell } from "./ui/Table";
import { Badge } from "./ui/Badge";

export function AdminVentaRow({ venta, onClick }) {
    return (
        <tr
            onClick={onClick}
            className="cursor-pointer hover:bg-paper/40 transition-colors border-b border-line last:border-0"
        >
            <TableCell className="font-mono-ticket font-bold">{venta.codigoComprobante}</TableCell>
            <TableCell>{new Date(venta.fecha).toLocaleDateString("es-AR")}</TableCell>
            <TableCell>
                {venta.clienteNombre
                    ? [venta.clienteNombre, venta.clienteApellido].filter(Boolean).join(" ")
                    : "Anónima"}
            </TableCell>
            <TableCell className="font-mono-ticket">${Number(venta.total).toFixed(2)}</TableCell>
            <TableCell>
                <Badge estado={venta.estado} />
            </TableCell>
            <TableCell className="text-right text-forest font-semibold hover:underline">
                Ver detalle →
            </TableCell>
        </tr>
    );
}
