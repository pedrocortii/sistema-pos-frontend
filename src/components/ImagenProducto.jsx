import { useState } from "react";
import placeholderProducto from "../assets/placeholder-product.svg";

function obtenerUrlImagen(imagen) {
    const valor = typeof imagen === "string" ? imagen.trim() : "";
    if (!valor) return placeholderProducto;
    if (/^https?:\/\//i.test(valor)) return valor;

    const ruta = valor.startsWith("/") ? valor : "/" + valor;
    const baseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
    if (!baseUrl) return ruta;

    try {
        return new URL(ruta, new URL(baseUrl).origin).toString();
    } catch {
        return baseUrl + ruta;
    }
}

function ImagenProducto({ imagen, vistaPrevia, alt, className }) {
    const url = vistaPrevia || obtenerUrlImagen(imagen);
    const [urlFallida, setUrlFallida] = useState("");
    const src = urlFallida === url ? placeholderProducto : url;

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={function () { setUrlFallida(url); }}
        />
    );
}

export default ImagenProducto;
