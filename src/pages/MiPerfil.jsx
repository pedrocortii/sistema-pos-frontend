import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function MiPerfil() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });

    if (!usuario) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center px-6">
                <div className="max-w-md w-full bg-ticket border border-line p-8 text-center">
                    <p className="font-mono-ticket text-xs uppercase tracking-[0.25em] text-ink/50">
                        Perfil
                    </p>
                    <h1 className="font-display text-3xl text-ink mt-3">
                        No iniciaste sesión
                    </h1>
                    <Link to="/catalogo" className="inline-block mt-6 text-forest underline font-mono-ticket text-sm">
                        Ir al catálogo
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper">
            <main className="max-w-2xl mx-auto px-6 py-10">
                <div className="bg-ticket border border-line p-8">
                    <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-ink/50">
                        Mi perfil
                    </p>
                    <h1 className="font-display text-4xl text-ink mt-2">
                        {usuario.nombre} {usuario.apellido}
                    </h1>

                    <div className="mt-8 space-y-4 font-mono-ticket text-sm">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-ink/50">Email</p>
                            <p className="text-ink mt-1">{usuario.email}</p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-ink/50">DNI</p>
                            <p className="text-ink mt-1">{usuario.dni ?? usuario.documento ?? usuario.DNI ?? usuario.clienteDni ?? "No informado"}</p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-ink/50">Rol</p>
                            <p className="text-ink mt-1">{usuario.rol}</p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/catalogo"
                            className="bg-forest hover:bg-forest-dark text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 px-5 transition-colors no-underline"
                        >
                            Ir al catálogo
                        </Link>
                        <Link
                            to="/carrito"
                            className="border border-line text-ink font-mono-ticket text-sm uppercase tracking-wide py-3 px-5 transition-colors no-underline"
                        >
                            Ver carrito
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MiPerfil;
