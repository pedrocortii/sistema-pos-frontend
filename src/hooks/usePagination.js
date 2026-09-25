import { useState, useEffect, useCallback } from "react";
import { usePeticion } from "./usePeticion";

const parametrosIniciales = {};

export function usePagination(apiFunc, initialParams = parametrosIniciales) {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const { data, isLoading, error, execute, setData, setError } = usePeticion(apiFunc);

    const fetchPage = useCallback(async (params = {}) => {
        const result = await execute({
            ...initialParams,
            ...params,
            page,
            limit
        });
        
        return result;
    }, [execute, page, limit, initialParams]);

    useEffect(() => {
        fetchPage().catch(function () {
            // El error queda disponible para que la pantalla lo muestre.
        });
    }, [fetchPage]);

    return {
        data,
        isLoading,
        error,
        page,
        setPage,
        limit,
        fetchPage,
        setData,
        setError,
    };
}
