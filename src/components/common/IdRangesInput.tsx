import { InputNumber, Slider } from "antd";
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

    const [sliderValue, setSliderValue] = useState<[number, number]>([1, maximum ?? 0]);

    if (maximum == 0) {
        return <></>;
    }

    return <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
        <div className='flex-between' style={{ flexDirection: 'column', minWidth: 500, marginRight: 12 }} >
            <b>Select Badge IDs to Transfer</b>
            <Slider min={1} max={maximum} range
                style={{ minWidth: 500 }}
                value={sliderValue} onChange={(e) => {
                    setSliderValue(e);
                    setStartBadgeId(e[0]);
                    setEndBadgeId(e[1]);
                    setIdRanges([{ start: e[0], end: e[1] }]);
                }} />
        </div>
        <div className='flex-between' style={{ flexDirection: 'column', marginRight: 8 }} >
            <b>Start</b>
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
            <b>End</b>
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
    </div>
}