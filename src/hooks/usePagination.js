import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";

export function usePagination(apiFunc, initialParams = {}) {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const { data, isLoading, error, execute, setData, setError } = useApi(apiFunc);

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
        fetchPage();
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
