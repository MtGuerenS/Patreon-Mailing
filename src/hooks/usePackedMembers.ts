import { useState, useEffect } from "react";

export function usePackedMembers(year: string, month: string) {
    const [packedIds, setPackedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        window.patreonAPI
            .getPacked(parseInt(year), parseInt(month))
            .then((ids: string[]) => setPackedIds(new Set(ids)));
    }, [year, month]);
    
    const togglePacked = async (memberId: string) => {
        const next = !packedIds.has(memberId);
        await window.patreonAPI.setPacked(memberId, parseInt(year), parseInt(month), next);
        setPackedIds((prev) => {
            const s = new Set(prev);
            next ? s.add(memberId) : s.delete(memberId);
            return s;
        });
    };

    return { packedIds, togglePacked };
}