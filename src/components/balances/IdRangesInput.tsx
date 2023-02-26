import { Button, Input, InputNumber, Slider, Tooltip } from "antd";
import { useState } from "react";
import { IdRange } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { SortIdRangesAndMergeIfNecessary } from "../../bitbadges-api/idRanges";
import { DeleteOutlined } from "@ant-design/icons";

export function IdRangesInput({
    setIdRanges,
    maximum,
    darkMode
}: {
    setIdRanges: (idRanges: IdRange[]) => void,
    maximum?: number,
    darkMode?: boolean,
}) {
    const [numRanges, setNumRanges] = useState(1);
    const [sliderValues, setSliderValues] = useState<[number, number][]>([[1, maximum ?? 1]]);
    const [inputStr, setInputStr] = useState(`1-${maximum ?? 1}`);


    if (maximum == 0) {
        return <></>;
    }

    const overlaps = sliderValues.some(([start1, end1], i) => {
        return sliderValues.some(([start2, end2], j) => {
            if (i === j) {
                return false;
            }
            return start1 <= end2 && start2 <= end1;
        });
    });

    if (maximum == 1) {
        return <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
            <div className='flex-between' style={{ flexDirection: 'column', minWidth: 500, marginRight: 12 }} >
                There is only one badge in this collection, so we have automatically selected it for you!
            </div>
        </div>
    }

    return <>
        {new Array(numRanges).fill(0).map((_, i) => {
            return <div key={i} style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
                <div className='flex-between' style={{ flexDirection: 'column', minWidth: 500, marginRight: 12 }} >
                    <b>Select Badge IDs to Transfer</b>
                    <Slider min={1} max={maximum} range
                        style={{ minWidth: 500 }}
                        value={sliderValues[i]} onChange={(e) => {
                            const newSliderValues = sliderValues.map((v, j) => i === j ? e : v);
                            setSliderValues(newSliderValues);
                            setIdRanges(newSliderValues.map(([start, end]) => ({ start, end })));
                            setInputStr(newSliderValues.map(([start, end]) => `${start}-${end}`).join(', '));
                        }}
                    />
                </div>
                <div className='flex-between' style={{ flexDirection: 'column', marginRight: 8 }} >
                    <b>Start</b>
                    <InputNumber
                        min={1}
                        max={sliderValues[i][1]}
                        value={sliderValues[i][0]}
                        onChange={
                            (value: number) => {
                                if (value >= 0 && value <= sliderValues[i][1]) {
                                    const newSliderValues: [number, number][] = sliderValues.map((v, j) => i === j ? [value, v[1]] : v);
                                    setSliderValues(newSliderValues);
                                    setIdRanges(newSliderValues.map(([start, end]) => ({ start, end })));
                                    setInputStr(newSliderValues.map(([start, end]) => `${start}-${end}`).join(', '));
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
                        value={sliderValues[i][1]}
                        onChange={
                            (value: number) => {
                                if (value >= 0 && value >= sliderValues[i][0]) {
                                    const newSliderValues: [number, number][] = sliderValues.map((v, j) => i === j ? [v[0], value] : v);
                                    setSliderValues(newSliderValues);
                                    setIdRanges(newSliderValues.map(([start, end]) => ({ start, end })));
                                    setInputStr(newSliderValues.map(([start, end]) => `${start}-${end}`).join(', '));
                                }
                            }
                        }
                        style={darkMode ? {
                            backgroundColor: PRIMARY_BLUE,
                            color: PRIMARY_TEXT,
                        } : undefined}
                    />
                </div>
                <div style={{ display: 'flex' }} >
                    <Tooltip title="Delete Range" placement='bottom'>
                        <DeleteOutlined
                            style={{
                                fontSize: 24, marginLeft: 20, marginTop: 16,
                                cursor: numRanges > 1 ? 'pointer' : 'not-allowed',
                            }}
                            onClick={() => {
                                if (numRanges > 1) {
                                    setNumRanges(numRanges - 1);
                                    setSliderValues(sliderValues.filter((_, j) => i !== j));
                                    setIdRanges(sliderValues.filter((_, j) => i !== j).map(([start, end]) => ({ start, end })));
                                    setInputStr(sliderValues.filter((_, j) => i !== j).map(([start, end]) => `${start}-${end}`).join(', '));
                                }
                            }}
                            disabled={numRanges === 1}
                        />
                    </Tooltip>
                </div>

            </div>
        })}

        <br />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button type='primary'
                style={{ marginRight: 12 }}
                onClick={() => {
                    setNumRanges(numRanges + 1)
                    setSliderValues([...sliderValues, [1, maximum ?? 0]]);
                    setIdRanges([...sliderValues, [1, maximum ?? 0]].map(([start, end]) => ({ start, end })));
                    setInputStr([...sliderValues, [1, maximum ?? 0]].map(([start, end]) => `${start}-${end}`).join(', '));
                }}>
                Add Range
            </Button>
            {overlaps &&
                <Button type='primary'
                    onClick={() => {
                        const newIdRanges = SortIdRangesAndMergeIfNecessary(sliderValues.map(([start, end]) => ({ start, end })));
                        setNumRanges(newIdRanges.length);
                        setSliderValues(newIdRanges.map(({ start, end }) => [start, end]));
                        setIdRanges(newIdRanges);
                        setInputStr(newIdRanges.map(({ start, end }) => [start, end]).map(([start, end]) => `${start}-${end}`).join(', '));
                    }}>
                    Sort Ranges And Remove Overlaps
                </Button>
            }
        </div>
        {
            overlaps &&
            <div style={{ color: 'red', textAlign: 'center' }}>
                <b>Overlapping ranges are not allowed.</b>
            </div>
        }

        <br />
        <div style={{ display: 'flex' }} >
            <Input
                style={{ width: '100%', marginTop: 16, color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}
                value={inputStr}
                onChange={(e) => {
                    setInputStr(e.target.value);


                    let sliderValues: [number, number][] = [];

                    const splitSliderValues = e.target.value.split(', ');
                    for (const sliderValue of splitSliderValues) {
                        if (sliderValue.split('-').length !== 2) {
                            continue;
                        } else {
                            if (sliderValue.split('-')[0] === '' || sliderValue.split('-')[1] === '') {
                                continue;
                            }
                            sliderValues.push([parseInt(sliderValue.split('-')[0]), parseInt(sliderValue.split('-')[1])]);
                        }
                    }

                    setSliderValues(sliderValues);
                    setNumRanges(sliderValues.length);
                    setIdRanges(sliderValues.map(([start, end]) => ({ start, end })));
                }}
            />
        </div>
    </>
}
