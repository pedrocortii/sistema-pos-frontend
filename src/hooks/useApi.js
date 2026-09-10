import { useState, useCallback } from "react";

export function useApi(apiFunc) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiFunc(...args);
            setData(result);
            return result;
        } catch (err) {
            const mensaje = err.response?.data?.mensaje || err.message || "Ocurrió un error inesperado";
            setError(mensaje);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [apiFunc]);

    return {
        data,
        isLoading,
        error,
        execute,
        setData,
        setError,
    };
}
