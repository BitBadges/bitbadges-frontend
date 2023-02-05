import { InputNumber } from "antd";
import { IdRange } from "../../bitbadges-api/types";
import { useState } from "react";

//TODO: support multiple IdRanges
export function IdRangesInput(
    {
        idRanges,
        setIdRanges,
        maximum,
    }: {
        idRanges: IdRange[],
        setIdRanges: (idRanges: IdRange[]) => void,
        maximum?: number,
    }
) {
    const [startBadgeId, setStartBadgeId] = useState<number>(0);
    const [endBadgeId, setEndBadgeId] = useState<number>(maximum ?? 0);

    
    return <>
        <div className='flex-between'>
            Badge ID Start:
            <InputNumber
                min={0}
                max={endBadgeId}
                value={startBadgeId} onChange={
                    (value: number) => {
                        setStartBadgeId(value);

                        if (value >= 0 && endBadgeId >= 0 && value <= endBadgeId) {
                            setIdRanges([{ start: value, end: endBadgeId }]);
                        }
                    }
                }
            />
        </div>
        <div className='flex-between'
        >
            Badge ID End:
            <InputNumber
                min={0}
                max={maximum}
                title='Amount to Transfer'
                value={endBadgeId} onChange={
                    (value: number) => {
                        setEndBadgeId(value);

                        if (startBadgeId >= 0 && value >= 0 && startBadgeId <= value) {
                            setIdRanges([{ start: startBadgeId, end: value }]);
                        }
                    }
                }
            />
        </div>
    </>
}