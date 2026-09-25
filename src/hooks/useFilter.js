import { useState, useMemo } from "react";

export function useFilter(data, filterKey = (item) => item) {
    const [query, setQuery] = useState("");

    const filteredData = useMemo(() => {
        // Aseguramos que data sea siempre un array para evitar crashes
        const list = Array.isArray(data) ? data : [];

        if (!query) return list;
        const lowerQuery = query.toLowerCase();
        return list.filter((item) => {
            const value = filterKey(item);
            if (Array.isArray(value)) {
                return value.some((v) => String(v).toLowerCase().includes(lowerQuery));
            }
            return String(value).toLowerCase().includes(lowerQuery);
        });
    }, [data, query, filterKey]);

    return {
        query,
        setQuery,
        filteredData,
    };
}
