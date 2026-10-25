import { TableCell } from "./ui/Table";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import ImagenProducto from "./ImagenProducto";
import { SlidersHorizontal } from "lucide-react";

export function AdminStockRow({ producto, onAdjust, esAdministrador }) {
    const esBajo = producto.stockDisponible <= 5;
    return (
        <tr className="border-b border-line last:border-0 hover:bg-paper/40 transition-colors">
            <TableCell>
                <ImagenProducto
                    imagen={producto.imagen}
                    alt={"Imagen de " + producto.nombre}
                    className="h-10 w-10 rounded object-cover"
                />
            </TableCell>
            <TableCell className="font-medium">{producto.nombre}</TableCell>
            <TableCell className="font-mono-ticket">{producto.stock}</TableCell>
            <TableCell className="font-mono-ticket">{producto.stockReservado}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <span className="font-mono-ticket">{producto.stockDisponible}</span>
                    {esBajo && (
                        <Badge variant="danger" size="xs">
                            Stock bajo
                        </Badge>
                    )}
                </div>
            </TableCell>
            {esAdministrador && (
                <TableCell className="text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAdjust(producto)}
                        icon={SlidersHorizontal}
                    >
                        Ajustar
                    </Button>
                </TableCell>
            )}
        </tr>
    );
}
