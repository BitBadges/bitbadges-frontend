import { InputNumber } from "antd";
import { useState } from "react";
import { IdRange } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";

//TODO: support multiple IdRanges
export function IdRangesInput({
    setIdRanges,
    maximum,
    darkMode
}: {
    setIdRanges: (idRanges: IdRange[]) => void,
    maximum?: number,
    darkMode?: boolean,
}) {
    const [startBadgeId, setStartBadgeId] = useState<number>(1);
    const [endBadgeId, setEndBadgeId] = useState<number>(maximum ?? 0);

    if (maximum == 0) {
        return <></>;
    }

    return <>
        <div className='flex-between' style={{ flexDirection: 'column' }} >
            <b>Badge ID Start</b>
            <InputNumber
                min={1}
                max={endBadgeId}
                value={startBadgeId} onChange={
                    (value: number) => {
                        setStartBadgeId(value);

                        if (value >= 0 && endBadgeId >= 0 && value <= endBadgeId) {
                            setIdRanges([{ start: value, end: endBadgeId }]);
                        }
                    }
                }
                style={darkMode ? {
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT,
                } : undefined}
            />
        </div>
        <div className='flex-between' style={{ flexDirection: 'column' }} >
            <b>Badge ID End</b>
            <InputNumber
                min={1}
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
                style={darkMode ? {
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT,
                } : undefined}
            />
        </div>
    </>
}