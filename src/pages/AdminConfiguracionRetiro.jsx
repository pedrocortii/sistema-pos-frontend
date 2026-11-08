import { useEffect, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { obtenerConfiguracionRetiro, guardarConfiguracionRetiro } from "../api/retiros";

const diasSemana = [
    { valor: 0, etiqueta: "Domingo" },
    { valor: 1, etiqueta: "Lunes" },
    { valor: 2, etiqueta: "Martes" },
    { valor: 3, etiqueta: "Miércoles" },
    { valor: 4, etiqueta: "Jueves" },
    { valor: 5, etiqueta: "Viernes" },
    { valor: 6, etiqueta: "Sábado" }
];

function nuevaConfiguracion(configuracion) {
    return configuracion || {
        diasAtencion: [],
        horaApertura: "",
        horaCierre: "",
        intervaloMinutos: "",
        excepciones: []
    };
}

function AdminConfiguracionRetiro() {
    const [configuracion, setConfiguracion] = useState(nuevaConfiguracion(null));
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [fechaExcepcion, setFechaExcepcion] = useState("");
    const [cerradoExcepcion, setCerradoExcepcion] = useState(true);
    const [aperturaExcepcion, setAperturaExcepcion] = useState("");
    const [cierreExcepcion, setCierreExcepcion] = useState("");

    useEffect(function () {
        let activo = true;
        obtenerConfiguracionRetiro().then(function (datos) {
            if (activo) setConfiguracion(nuevaConfiguracion(datos));
        }).catch(function (error) {
            if (activo) setMensaje({
                tipo: "error",
                texto: error.response?.data?.mensaje || "No se pudo cargar la configuración de retiro."
            });
        }).finally(function () {
            if (activo) setCargando(false);
        });
        return function () { activo = false; };
    }, []);

    function actualizar(campo, valor) {
        setConfiguracion(function (actual) { return { ...actual, [campo]: valor }; });
    }

    function alternarDia(dia) {
        const diasAtencion = configuracion.diasAtencion.includes(dia)
            ? configuracion.diasAtencion.filter(function (actual) { return actual !== dia; })
            : [...configuracion.diasAtencion, dia].sort();
        actualizar("diasAtencion", diasAtencion);
    }

    function agregarExcepcion(evento) {
        evento.preventDefault();
        if (!fechaExcepcion) {
            setMensaje({ tipo: "error", texto: "Seleccioná una fecha para la excepción." });
            return;
        }
        if (configuracion.excepciones.some(function (excepcion) { return excepcion.fecha === fechaExcepcion; })) {
            setMensaje({ tipo: "error", texto: "Ya existe una excepción para esa fecha." });
            return;
        }
        if (!cerradoExcepcion && (!aperturaExcepcion || !cierreExcepcion || aperturaExcepcion >= cierreExcepcion)) {
            setMensaje({ tipo: "error", texto: "Ingresá un horario especial válido, con cierre posterior a la apertura." });
            return;
        }

        const excepcion = cerradoExcepcion
            ? { fecha: fechaExcepcion, cerrado: true }
            : {
                fecha: fechaExcepcion,
                cerrado: false,
                horaApertura: aperturaExcepcion,
                horaCierre: cierreExcepcion
            };
        actualizar("excepciones", [...configuracion.excepciones, excepcion].sort(function (a, b) {
            return a.fecha.localeCompare(b.fecha);
        }));
        setFechaExcepcion("");
        setAperturaExcepcion("");
        setCierreExcepcion("");
        setMensaje(null);
    }

    async function guardar(evento) {
        evento.preventDefault();
        setGuardando(true);
        setMensaje(null);
        try {
            const datos = {
                ...configuracion,
                intervaloMinutos: Number(configuracion.intervaloMinutos)
            };
            const guardada = await guardarConfiguracionRetiro(datos);
            setConfiguracion(nuevaConfiguracion(guardada));
            setMensaje({ tipo: "success", texto: "La disponibilidad de retiro quedó actualizada." });
        } catch (error) {
            const errores = error.response?.data?.errores;
            setMensaje({
                tipo: "error",
                texto: Array.isArray(errores) && errores.length
                    ? errores.join(". ")
                    : error.response?.data?.mensaje || "No se pudo guardar la configuración."
            });
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return <p role="status" className="text-sm text-ink/60">Cargando configuración de retiro...</p>;
    }

    return (
        <section>
            <PageHeader
                etiqueta="Administración"
                titulo="Horarios de retiro"
                descripcion="Definí cuándo pueden retirar los clientes. Si no guardás una configuración, el checkout no ofrecerá turnos."
            />

            {mensaje && <Alert tipo={mensaje.tipo} texto={mensaje.texto} className="mb-5" />}

            <form onSubmit={guardar} className="space-y-5">
                <Card>
                    <CardTitle className="mb-4">Días y horario habitual</CardTitle>
                    <fieldset>
                        <legend className="mb-2 text-xs text-ink/60">Días de atención</legend>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {diasSemana.map(function (dia) {
                                return (
                                    <label key={dia.valor} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={configuracion.diasAtencion.includes(dia.valor)}
                                            onChange={function () { alternarDia(dia.valor); }}
                                            className="accent-forest"
                                        />
                                        {dia.etiqueta}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <Input
                            label="Apertura"
                            type="time"
                            value={configuracion.horaApertura}
                            onChange={function (evento) { actualizar("horaApertura", evento.target.value); }}
                            required
                        />
                        <Input
                            label="Cierre"
                            type="time"
                            value={configuracion.horaCierre}
                            onChange={function (evento) { actualizar("horaCierre", evento.target.value); }}
                            required
                        />
                        <Input
                            label="Duración de cada turno (minutos)"
                            type="number"
                            min="1"
                            max="720"
                            value={configuracion.intervaloMinutos}
                            onChange={function (evento) { actualizar("intervaloMinutos", evento.target.value); }}
                            required
                        />
                    </div>
                    <p className="mt-3 text-xs text-ink/55">
                        Se ofrecerán intervalos consecutivos de la duración indicada, siempre que entren antes del cierre.
                    </p>
                </Card>

                <Card>
                    <CardTitle className="mb-4">Días no laborables y excepciones</CardTitle>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <Input
                            label="Fecha"
                            type="date"
                            value={fechaExcepcion}
                            onChange={function (evento) { setFechaExcepcion(evento.target.value); }}
                        />
                        <label className="flex items-center gap-2 self-end pb-2 text-sm">
                            <input
                                type="checkbox"
                                checked={cerradoExcepcion}
                                onChange={function (evento) { setCerradoExcepcion(evento.target.checked); }}
                                className="accent-forest"
                            />
                            Cerrado ese día
                        </label>
                    </div>
                    {!cerradoExcepcion && (
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Apertura especial"
                                type="time"
                                value={aperturaExcepcion}
                                onChange={function (evento) { setAperturaExcepcion(evento.target.value); }}
                            />
                            <Input
                                label="Cierre especial"
                                type="time"
                                value={cierreExcepcion}
                                onChange={function (evento) { setCierreExcepcion(evento.target.value); }}
                            />
                        </div>
                    )}
                    <Button type="button" variant="secondary" onClick={agregarExcepcion} className="mt-4">
                        Agregar excepción
                    </Button>

                    {configuracion.excepciones.length > 0 && (
                        <ul className="mt-4 divide-y divide-line border-y border-line">
                            {configuracion.excepciones.map(function (excepcion) {
                                const descripcion = excepcion.cerrado
                                    ? "Cerrado"
                                    : `Horario especial: ${excepcion.horaApertura} a ${excepcion.horaCierre}`;
                                return (
                                    <li key={excepcion.fecha} className="flex items-center justify-between gap-3 py-2 text-sm">
                                        <span>{excepcion.fecha}: {descripcion}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={function () {
                                                actualizar("excepciones", configuracion.excepciones.filter(function (actual) {
                                                    return actual.fecha !== excepcion.fecha;
                                                }));
                                            }}
                                        >
                                            Quitar
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <Button type="submit" loading={guardando} loadingText="Guardando...">
                    Guardar disponibilidad
                </Button>
            </form>
        </section>
    );
}

export default AdminConfiguracionRetiro;
