import { TableCell } from "./ui/Table";
import { Button } from "./ui/Button";
import ImagenProducto from "./ImagenProducto";
import { Pencil, Trash2 } from "lucide-react";

export function AdminProductoRow({ producto, onEdit, onDelete, esAdministrador }) {
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
            <TableCell className="font-mono-ticket">${Number(producto.precio).toFixed(2)}</TableCell>
            <TableCell className="font-mono-ticket">{producto.stock - (producto.stockReservado || 0)}</TableCell>
            <TableCell>{producto.categoria}</TableCell>
            {esAdministrador && (
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEdit(producto)}
                            aria-label="Editar producto"
                            title="Editar"
                        >
                            <Pencil size={16} />
                        </Button>
                        <Button
                            variant="danger-outline"
                            size="icon-sm"
                            onClick={() => onDelete(producto)}
                            aria-label="Eliminar producto"
                            title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </TableCell>
            )}
        </tr>
    );
}
