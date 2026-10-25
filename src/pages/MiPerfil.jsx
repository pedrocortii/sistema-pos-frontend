import { Link } from "react-router-dom";
import { UserX } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

function MiPerfil() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });

    if (!usuario) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center px-6">
                <Card className="max-w-md w-full text-center p-8">
                    <EmptyState
                        icono={UserX}
                        titulo="No iniciaste sesión"
                        descripcion="Iniciá sesión o navegá como invitado para ver tus datos."
                        accion={
                            <Link to="/catalogo">
                                <Button>Ir al catálogo</Button>
                            </Link>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper flex flex-col">
            <EncabezadoCliente />
            <main className="max-w-2xl w-full mx-auto px-6 py-10 flex-1">
                <Card className="p-8">
                    <PageHeader
                        etiqueta="Mi perfil"
                        titulo={`${usuario.nombre} ${usuario.apellido || ""}`.trim()}
                        className="mb-6"
                    />

                    <div className="space-y-4 font-mono-ticket text-sm border-t border-line pt-6">
                        <div>
                            <p className="text-xs text-ink/50">Email</p>
                            <p className="text-ink mt-1 font-medium">{usuario.email}</p>
                        </div>

                        <div>
                            <p className="text-xs text-ink/50">DNI</p>
                            <p className="text-ink mt-1 font-medium">{usuario.dni || usuario.documento || usuario.DNI || usuario.clienteDni || "No informado"}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-line flex flex-wrap gap-3">
                        {usuario.rol === "Cliente" && (
                            <Link to="/historial">
                                <Button>Historial de compras</Button>
                            </Link>
                        )}
                        <Link to="/catalogo">
                            <Button variant="secondary">Ir al catálogo</Button>
                        </Link>
                        <Link to="/carrito">
                            <Button variant="secondary">Ver carrito</Button>
                        </Link>
                    </div>
                </Card>
            </main>
        </div>
    );
}

export default MiPerfil;
