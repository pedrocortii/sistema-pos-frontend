import { useCallback, useState } from "react";

function obtenerMensajeError(error) {
    return error.response?.data?.mensaje || error.message || "Ocurrió un error inesperado";
}

/**
 * Centraliza el ciclo de una petición HTTP y expone su respuesta, carga y error.
 */
export function usePeticion(peticion, opciones = {}) {
    const [respuesta, setRespuesta] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const formatearErrorPersonalizado = opciones.obtenerMensajeError;

    const ejecutar = useCallback(async (...args) => {
        setCargando(true);
        setError(null);

        try {
            const resultado = await peticion(...args);
            setRespuesta(resultado);
            return resultado;
        } catch (errorPeticion) {
            const formatearError = formatearErrorPersonalizado || obtenerMensajeError;
            setError(formatearError(errorPeticion));
            throw errorPeticion;
        } finally {
            setCargando(false);
        }
    }, [peticion, formatearErrorPersonalizado]);

    return {
        respuesta,
        cargando,
        error,
        ejecutar,
        setRespuesta,
        setError,
        // Alias para facilitar una migración gradual de los hooks existentes.
        data: respuesta,
        isLoading: cargando,
        execute: ejecutar,
        setData: setRespuesta,
    };
}
