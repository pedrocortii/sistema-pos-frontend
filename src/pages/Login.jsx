import { Link, useLocation } from "react-router-dom";
import FormularioLogin from "../components/FormularioLogin";

function Login() {
    const ubicacion = useLocation();
    const registroExitoso = ubicacion.state && ubicacion.state.registroExitoso;

    return (
        <FormularioLogin
            etiqueta="Acceso para cajeros y administradores"
            titulo="Bienvenido de nuevo"
            textoBoton="Ingresar"
            mensajeExito={registroExitoso ? "Cuenta creada correctamente. Ya podes iniciar sesion." : ""}
        >
            <p className="text-center text-sm text-ink/60">
                Es cliente?{" "}
                <Link to="/catalogo" className="text-forest underline">
                    Ir al catalogo
                </Link>
            </p>
        </FormularioLogin>
    );
}

export default Login;
