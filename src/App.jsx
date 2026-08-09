import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import ProductoDetalle from "./pages/ProductoDetalle";
import Carrito from "./pages/Carrito";
import RutaProtegida from "./components/RutaProtegida";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route
                    path="/dashboard"
                    element={
                        <RutaProtegida>
                            <Dashboard />
                        </RutaProtegida>
                    }
                />
                <Route
                    path="/catalogo"
                    element={
                        <RutaProtegida>
                            <Catalogo />
                        </RutaProtegida>
                    }
                />
                <Route
                    path="/catalogo/:id"
                    element={
                        <RutaProtegida>
                            <ProductoDetalle />
                        </RutaProtegida>
                    }
                />
                <Route
                    path="/carrito"
                    element={
                        <RutaProtegida>
                            <Carrito />
                        </RutaProtegida>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;