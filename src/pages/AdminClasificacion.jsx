import { useEffect, useState } from "react";
import { Edit, Plus, Power } from "lucide-react";
import { categoriasApi, tiposProductoApi } from "../api/clasificacion";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

function GrupoClasificacion({ titulo, api }) {
    const [items, setItems] = useState([]);
    const [nombre, setNombre] = useState("");
    const [editando, setEditando] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const cargar = function () { setCargando(true); api.listar().then(setItems).catch((e) => setError(e.response?.data?.mensaje || "No se pudo cargar la lista.")).finally(() => setCargando(false)); };
    useEffect(function () { api.listar().then(setItems).catch((e) => setError(e.response?.data?.mensaje || "No se pudo cargar la lista.")).finally(() => setCargando(false)); }, [api]);
    async function guardar(event) {
        event.preventDefault(); setError(null);
        if (!nombre.trim()) return setError("El nombre es obligatorio.");
        try { if (editando) await api.actualizar(editando, nombre.trim()); else await api.crear(nombre.trim()); setNombre(""); setEditando(null); cargar(); }
        catch (e) { setError(e.response?.data?.mensaje || "No se pudo guardar."); }
    }
    async function desactivar(item) {
        if (!window.confirm(`¿Desactivar “${item.nombre}”?`)) return;
        try { await api.desactivar(item.id); cargar(); } catch (e) { setError(e.response?.data?.mensaje || "No se pudo desactivar."); }
    }
    return <div className="rounded border border-line bg-ticket p-5">
        <h2 className="font-display text-xl text-ink">{titulo}</h2>
        {error && <Alert tipo="error" texto={error} className="mt-3" />}
        <form onSubmit={guardar} className="mt-4 flex gap-2"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={editando ? "Nuevo nombre" : "Agregar nombre"} /><Button type="submit" icon={editando ? Edit : Plus}>{editando ? "Actualizar" : "Agregar"}</Button>{editando && <Button type="button" variant="secondary" onClick={() => { setEditando(null); setNombre(""); }}>Cancelar</Button>}</form>
        <div className="mt-5 divide-y divide-line">{cargando ? <p className="py-4 text-sm text-ink/60">Cargando...</p> : !items.length ? <p className="py-4 text-sm text-ink/60">No hay opciones disponibles.</p> : items.map((item) => <div className="flex items-center justify-between py-3" key={item.id}><span>{item.nombre}</span><span className="flex gap-2"><Button variant="secondary" icon={Edit} onClick={() => { setEditando(item.id); setNombre(item.nombre); }}>Editar</Button><Button variant="secondary" icon={Power} onClick={() => desactivar(item)}>Desactivar</Button></span></div>)}</div>
    </div>;
}

export default function AdminClasificacion() {
    return <section><PageHeader etiqueta="Administración" titulo="Categorías y tipos de producto" descripcion="Administrá las opciones válidas para clasificar productos." /><div className="grid gap-6 lg:grid-cols-2"><GrupoClasificacion titulo="Categorías" api={categoriasApi} /><GrupoClasificacion titulo="Tipos de producto" api={tiposProductoApi} /></div></section>;
}
