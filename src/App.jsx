import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import ProductoDetalle from "./pages/ProductoDetalle";
import Carrito from "./pages/Carrito";
import ReimprimirComprobante from "./pages/ReimprimirComprobante";
import RutaProtegida from "./components/RutaProtegida";
import { useAuthStore } from "./store/authStore";

function RedireccionRaiz() {
    // Si ya esta autenticado, va al dashboard. Si no, al login.
    const token = useAuthStore(function (estado) { return estado.token; });
    return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RedireccionRaiz />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />

                {/* Rutas publicas: el cliente no necesita login. */}
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/catalogo/:id" element={<ProductoDetalle />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/comprobante/:codigo" element={<ReimprimirComprobante />} />

                {/* Rutas protegidas: cualquier usuario autenticado. */}
                <Route
                    path="/dashboard"
                    element={
                        <RutaProtegida>
                            <Dashboard />
                        </RutaProtegida>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;