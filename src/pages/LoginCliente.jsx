import { Link, useLocation } from "react-router-dom";
import FormularioLogin from "../components/FormularioLogin";

function LoginCliente() {
    const ubicacion = useLocation();
    const registroExitoso = ubicacion.state && ubicacion.state.registroExitoso;

    return (
        <FormularioLogin
            etiqueta="Acceso para clientes"
            titulo="Iniciar sesión"
            textoBoton="Ingresar como cliente"
            mensajeExito={registroExitoso ? "Cuenta creada correctamente. Ya podés iniciar sesión." : ""}
        >
            <p className="text-center text-sm text-ink/60">
                Todavía no tenés cuenta?{" "}
                <Link to="/registro" className="text-forest underline">
                    Crear cuenta
                </Link>
            </p>

            <p className="text-center text-sm text-ink/60">
                O podés seguir sin cuenta:{" "}
                <Link to="/catalogo" className="text-forest underline">
                    Ir al catálogo
                </Link>
            </p>
        </FormularioLogin>
    );
}

export default LoginCliente;
