import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { usePeticion } from "./usePeticion";

/**
 * Hook unificado para gestionar datos de tablas administrativas.
 * Maneja paginación, filtros, búsqueda y sincronización con la URL.
 */
export function useDataTable(apiFunc, {
    syncWithUrl = false,
    initialParams = {},
    limit = 10,
} = {}) {
    const [params, setParams] = useSearchParams();

    // Estado de paginación y filtros
    // Si syncWithUrl es true, priorizamos la URL. Si no, usamos estado local.
    const [page, setLocalPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filters, setLocalFilters] = useState({});
    const initialParamsRef = useRef(initialParams);

    const currentPage = syncWithUrl ? Number(params.get("pagina") || 1) : page;
    const currentSearch = syncWithUrl ? (params.get("buscar") || "") : search;
    const currentFilters = useMemo(() => syncWithUrl ?
        Object.fromEntries(Array.from(params.entries()).filter(([k]) => k !== "pagina" && k !== "buscar")) :
        filters, [syncWithUrl, params, filters]);

    const { data, isLoading, error, execute } = usePeticion(apiFunc);

    // Función para actualizar parámetros (ya sea en URL o estado local)
    const updateParam = useCallback((key, value) => {
        if (syncWithUrl) {
            const n = new URLSearchParams(params);
            if (value) n.set(key, value);
            else n.delete(key);

            if (key !== "pagina") n.set("pagina", "1");
            setParams(n);
        } else {
            if (key === "pagina") setLocalPage(value);
            else if (key === "buscar") setSearch(value);
            else {
                setLocalFilters(prev => {
                    const next = { ...prev };
                    if (value) next[key] = value;
                    else delete next[key];
                    return next;
                });
                setLocalPage(1);
            }
        }
    }, [params, setParams, syncWithUrl]);

    // Efecto para cargar datos cuando cambian los parámetros
    const fetchData = useCallback(async () => {
        return await execute({
            ...initialParamsRef.current,
            ...currentFilters,
            page: currentPage,
            limit,
            buscar: currentSearch,
        });
    }, [execute, currentPage, currentSearch, currentFilters, limit]);

    useEffect(() => {
        fetchData().catch(() => {});
    }, [fetchData]);

    return {
        data,
        isLoading,
        error,
        page: currentPage,
        search: currentSearch,
        filters: currentFilters,
        setPage: (p) => updateParam("pagina", p),
        setSearch: (s) => updateParam("buscar", s),
        setFilter: (k, v) => updateParam(k, v),
        refresh: fetchData,
    };
}
