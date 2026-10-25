import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { stockAdjustmentSchema } from "../validations/stockSchema";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";

function AjustarStockModal({ producto, alCerrar, alGuardar, guardando }) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(stockAdjustmentSchema),
    });

    const [localError, setLocalError] = useState("");

    function onSubmit(datos) {
        setLocalError("");
        const ajuste = Number(datos.cantidad);

        if (ajuste < 0 && producto.stockDisponible + ajuste < 0) {
            return setLocalError("El ajuste no puede dejar el stock disponible en negativo.");
        }

        alGuardar({
            tipo: ajuste > 0 ? "ENTRADA" : "SALIDA",
            cantidad: Math.abs(ajuste),
            referenciaId: datos.motivo.trim()
        });
    }

    return (
        <Modal
            abierto={true}
            alCerrar={alCerrar}
            etiqueta="Stock"
            titulo={`Ajustar ${producto.nombre}`}
            tamano="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm text-ink/60">
                    Disponible actual: <span className="font-mono-ticket font-bold text-ink">{producto.stockDisponible}</span>
                </p>

                <Input
                    label="Cantidad (+/-)"
                    type="number"
                    step="1"
                    required
                    {...register("cantidad")}
                    error={errors.cantidad}
                />

                <Textarea
                    label="Motivo"
                    rows={2}
                    required
                    {...register("motivo")}
                    error={errors.motivo}
                />

                {localError && <Alert tipo="error" texto={localError} />}

                <div className="flex justify-end gap-3 pt-3 border-t border-line">
                    <Button variant="secondary" onClick={alCerrar}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={guardando} loadingText="Guardando...">
                        Confirmar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default AjustarStockModal;
