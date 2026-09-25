import { useState, useCallback } from "react";

export function useModal() {
    const [modalData, setModalData] = useState(null);

    const open = useCallback((data = null) => {
        setModalData(data);
    }, []);

    const close = useCallback(() => {
        setModalData(null);
    }, []);

    return {
        isOpen: !!modalData,
        modalData,
        open,
        close,
    };
}
