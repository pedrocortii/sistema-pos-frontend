import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { stockAdjustmentSchema } from "../validations/stockSchema";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" role="dialog" aria-modal="true">
            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-ticket p-6 shadow-xl">
                <div className="flex justify-between">
                    <div>
                        <p className="font-mono-ticket text-xs uppercase tracking-wide text-forest">Stock</p>
                        <h2 className="font-display text-2xl">Ajustar {producto.nombre}</h2>
                    </div>
                    <button type="button" onClick={alCerrar} className="cursor-pointer p-1" aria-label="Cerrar">
                        <X />
                    </button>
                </div>

                <p className="mt-3 font-mono-ticket text-sm text-ink/60">
                    Disponible actual: <span className="font-bold text-ink">{producto.stockDisponible}</span>
                </p>

                <div className="mt-4">
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Cantidad (+/-)
                    </label>
                    <input
                        type="number"
                        step="1"
                        {...register("cantidad")}
                        className="mt-1 w-full border border-line bg-paper p-2 text-ink outline-none focus:border-forest"
                    />
                    {errors.cantidad && <p className="mt-1 text-xs text-red-600">{errors.cantidad.message}</p>}
                </div>

                <div className="mt-4">
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Motivo
                    </label>
                    <textarea
                        {...register("motivo")}
                        className="mt-1 min-h-20 w-full border border-line bg-paper p-2 text-ink outline-none focus:border-forest"
                    />
                    {errors.motivo && <p className="mt-1 text-xs text-red-600">{errors.motivo.message}</p>}
                </div>

                {localError && <p className="mt-3 font-mono-ticket text-sm text-red-600">{localError}</p>}

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={alCerrar} className="cursor-pointer px-4 py-2 font-mono-ticket text-sm">
                        Cancelar
                    </button>
                    <button
                        disabled={guardando}
                        className="cursor-pointer bg-forest px-4 py-2 font-mono-ticket text-sm text-paper disabled:opacity-60"
                    >
                        {guardando ? "Guardando..." : "Confirmar"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AjustarStockModal;
