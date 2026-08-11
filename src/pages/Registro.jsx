import { Link } from "react-router-dom";
import PanelAuth from "../components/PanelAuth";

function Registro() {
    return (
        <PanelAuth etiqueta="Acceso para cajeros y administradores" titulo="No se permite registro publico">
            <p className="font-mono-ticket text-sm text-ink/70 text-center leading-relaxed">
                Los clientes no necesitan cuenta: pueden comprar directamente
                desde el catalogo.
            </p>
            <p className="font-mono-ticket text-sm text-ink/70 text-center leading-relaxed mt-3">
                El alta de cajeros y administradores la realiza un
                administrador desde el panel de gestion.
            </p>

            <div className="mt-6 space-y-3">
                <Link
                    to="/catalogo"
                    className="block w-full bg-forest hover:bg-forest-dark text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 text-center transition-colors no-underline"
                >
                    Ir al catalogo
                </Link>
                <Link
                    to="/login"
                    className="block w-full text-center font-mono-ticket text-sm uppercase tracking-wide text-forest border-b-2 border-forest pb-1"
                >
                    Iniciar sesion
                </Link>
            </div>
        </PanelAuth>
    );
}

export default Registro;