import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { listarNotificaciones, marcarNotificacionComoLeida } from "../api/notificaciones";

function CampanaNotificaciones() {
    const [abierta, setAbierta] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [error, setError] = useState("");
    const marcando = useRef(new Set());

    useEffect(function () {
        let activa = true;
        let cargando = false;

        async function actualizar() {
            if (cargando) return;
            cargando = true;
            try {
                const resultado = await listarNotificaciones();
                if (activa) {
                    setNotificaciones(resultado.notificaciones);
                    setNoLeidas(resultado.noLeidas);
                    setError("");
                }
            } catch (errorPeticion) {
                if (activa) {
                    setError(errorPeticion.response?.data?.mensaje || "No se pudieron cargar las notificaciones.");
                }
            } finally {
                cargando = false;
            }
        }

        actualizar();
        const intervalo = window.setInterval(actualizar, 30000);
        return function () {
            activa = false;
            window.clearInterval(intervalo);
        };
    }, []);

    async function marcarLeida(id) {
        if (marcando.current.has(id)) return;
        marcando.current.add(id);
        try {
            const notificacion = await marcarNotificacionComoLeida(id);
            setNotificaciones(function (actuales) {
                return actuales.map(function (actual) {
                    return actual.id === id ? notificacion : actual;
                });
            });
            setNoLeidas(function (cantidad) {
                return Math.max(0, cantidad - 1);
            });
            setError("");
        } catch (errorPeticion) {
            setError(errorPeticion.response?.data?.mensaje || "No se pudo marcar la notificación como leída.");
        } finally {
            marcando.current.delete(id);
        }
    }

    return (
        <div className="relative">
            <button
                type="button"
                aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}
                aria-expanded={abierta}
                onClick={function () { setAbierta(function (estado) { return !estado; }); }}
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-forest transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-forest"
            >
                <Bell size={20} aria-hidden="true" />
                {noLeidas > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-ink">
                        {noLeidas > 99 ? "99+" : noLeidas}
                    </span>
                )}
            </button>

            {abierta && (
                <section
                    aria-label="Notificaciones"
                    className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-ticket shadow-xl"
                >
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <h2 className="text-sm font-semibold text-ink">Notificaciones</h2>
                        <span className="text-xs text-ink/55">{noLeidas} sin leer</span>
                    </div>

                    {error && <p role="alert" className="px-4 py-3 text-xs text-red-700">{error}</p>}

                    <ul className="max-h-96 divide-y divide-line overflow-y-auto">
                        {notificaciones.map(function (notificacion) {
                            const leida = Boolean(notificacion.leidaEn);
                            return (
                                <li key={notificacion.id} className={leida ? "bg-ticket" : "bg-forest/5"}>
                                    <div className="flex items-start gap-2 px-4 py-3">
                                        <Link
                                            to={"/admin/ventas/" + notificacion.venta.id}
                                            onClick={function () {
                                                if (!leida) marcarLeida(notificacion.id);
                                                setAbierta(false);
                                            }}
                                            className="min-w-0 flex-1 text-left no-underline focus-visible:outline-2 focus-visible:outline-forest"
                                        >
                                            <span className="block text-xs font-semibold text-forest">
                                                Compra {notificacion.venta.codigoComprobante}
                                            </span>
                                            <span className={"mt-1 block text-sm " + (leida ? "text-ink/60" : "text-ink")}>
                                                {notificacion.mensaje}
                                            </span>
                                            <span className="mt-1 block text-[11px] text-ink/45">
                                                {new Date(notificacion.creadaEn).toLocaleString("es-AR")}
                                            </span>
                                        </Link>
                                        {!leida && (
                                            <button
                                                type="button"
                                                aria-label={`Marcar compra ${notificacion.venta.codigoComprobante} como leída`}
                                                onClick={function () { marcarLeida(notificacion.id); }}
                                                className="mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-forest hover:bg-forest/10 focus-visible:outline-2 focus-visible:outline-forest"
                                            >
                                                <Check size={16} aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                        {notificaciones.length === 0 && !error && (
                            <li className="px-4 py-8 text-center text-sm text-ink/55">No hay notificaciones todavía.</li>
                        )}
                    </ul>
                </section>
            )}
        </div>
    );
}

export default CampanaNotificaciones;
