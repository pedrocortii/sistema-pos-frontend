import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import LoginCliente from "./pages/LoginCliente";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import ProductoDetalle from "./pages/ProductoDetalle";
import Carrito from "./pages/Carrito";
import ReimprimirComprobante from "./pages/ReimprimirComprobante";
import MiPerfil from "./pages/MiPerfil";
import HistorialCompras from "./pages/HistorialCompras";
import RutaProtegida from "./components/RutaProtegida";
import AdminLayout from "./components/AdminLayout";
import AdminProductos from "./pages/AdminProductos";
import AdminStock from "./pages/AdminStock";
import AdminVentas from "./pages/AdminVentas";
import AdminVentaDetalle from "./pages/AdminVentaDetalle";
import AdminVentaRapida from "./pages/AdminVentaRapida";
import { useAuthStore } from "./store/authStore";

function RedireccionRaiz() {
    const token = useAuthStore(function (estado) { return estado.token; });
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    if (!token) return <Navigate to="/login" replace />;
    if (usuario?.rol === "Administrador") return <Navigate to="/admin/dashboard" replace />;
    if (usuario?.rol === "Cajero") return <Navigate to="/admin/venta-rapida" replace />;
    return <Navigate to="/catalogo" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RedireccionRaiz />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login-cliente" element={<LoginCliente />} />
                <Route path="/registro" element={<Registro />} />

                {/* Rutas publicas: el cliente no necesita login. */}
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/catalogo/:id" element={<ProductoDetalle />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/mi-perfil" element={<MiPerfil />} />
                <Route path="/comprobante/:codigo" element={<ReimprimirComprobante />} />

                {/* Rutas protegidas: cualquier usuario autenticado. */}
                <Route
                    path="/dashboard"
                    element={
                        <RutaProtegida rolesPermitidos={["Administrador"]}>
                            <Dashboard />
                        </RutaProtegida>
                    }
                />

                {/* Rutas protegidas: clientes autenticados. */}
                <Route
                    path="/historial"
                    element={
                        <RutaProtegida rolesPermitidos={["Cliente"]}>
                            <HistorialCompras />
                        </RutaProtegida>
                    }
                />

                <Route element={<RutaProtegida rolesPermitidos={["Administrador", "Cajero"]} />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="productos" replace />} />
                        <Route path="dashboard" element={<RutaProtegida rolesPermitidos={["Administrador"]}><Dashboard /></RutaProtegida>} />
                        <Route path="venta-rapida" element={<AdminVentaRapida />} />
                        <Route
                            path="productos"
                            element={<AdminProductos />}
                        />
                        <Route
                            path="stock"
                            element={<AdminStock />}
                        />
                        <Route
                            path="ventas"
                            element={<AdminVentas />}
                        />
                        <Route path="ventas/:id" element={<AdminVentaDetalle />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
