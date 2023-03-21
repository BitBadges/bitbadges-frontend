import { DeleteOutlined } from "@ant-design/icons";
import { Button, Divider, Input, InputNumber, Slider, Tooltip } from "antd";
import { useState } from "react";
import { getBlankBalance } from "../../bitbadges-api/balances";
import { SortIdRangesAndMergeIfNecessary } from "../../bitbadges-api/idRanges";
import { BitBadgeCollection, IdRange } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm";

export function IdRangesInput({
    idRanges,
    setIdRanges,
    maximum,
    minimum,
    darkMode,
    verb,
    collection,
    defaultAllSelected = true
}: {
    idRanges?: IdRange[],
    setIdRanges: (idRanges: IdRange[]) => void,
    maximum?: number,
    minimum?: number,
    darkMode?: boolean,
    verb?: string,
    collection: BitBadgeCollection,
    defaultAllSelected?: boolean,
}) {
    const isDefaultAllSelected = idRanges ? idRanges.length === 1 && idRanges[0].start === minimum && idRanges[0].end === maximum : defaultAllSelected;

    const [numRanges, setNumRanges] = useState(idRanges ? idRanges.length : 1);
    const [sliderValues, setSliderValues] = useState<[number, number][]>(
        idRanges ? idRanges.map(({ start, end }) => [start, end])
            : [[minimum ?? 1, maximum ?? 1]]);
    const [inputStr, setInputStr] = useState(
        idRanges ?
            idRanges.map(({ start, end }) => `${start}-${end}`).join(', ')
            : `${minimum ?? 1}-${maximum ?? 1}`);
    const [updateAllIsSelected, setUpdateAllIsSelected] = useState(isDefaultAllSelected);
    // const [clicked, setClicked] = useState(false);

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

    const switchOptions = [];
    if (maximum !== 1) {
        switchOptions.push({
            title: 'Custom',
            message: `Select specific badges.`,
            isSelected: !updateAllIsSelected,
        });
    }

    switchOptions.push({
        title: 'All Badges',
        message: `Select all badges in this collection. ${maximum === 1 ? 'This is auto-selected because there is only one badge.' : ''}`,
        isSelected: updateAllIsSelected,
    });


    return <>
        <SwitchForm
            options={switchOptions}
            onSwitchChange={(_idx, name) => {
                setUpdateAllIsSelected(name === 'All Badges');
                if (name === 'All Badges') {
                    setIdRanges([{ start: minimum ?? 1, end: maximum ?? 1 }]);
                }
                // setClicked(true);
            }}
        // noSelectUntilClick
        />

        {!updateAllIsSelected && <>
            <br />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                <Input
                    style={{ width: 750, marginTop: 16, color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, textAlign: 'center' }}
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
            <br />
            {/* <h2 style={{ textAlign: 'center', color: PRIMARY_TEXT }}>Badge ID Select</h2> */}
            {
                new Array(numRanges).fill(0).map((_, i) => {
                    return <div key={i} style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
                        <div className='flex-between' style={{ flexDirection: 'column', minWidth: 500, marginRight: 12 }} >
                            <b>Select Badge IDs to {verb ? verb : 'Transfer'}</b>
                            <Slider min={minimum ?? 1} max={maximum} range
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
                                min={minimum ?? 1}
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
                                min={minimum ?? 1}
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
                })
            }

            <br />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button type='primary'
                    style={{ marginRight: 12 }}
                    onClick={() => {
                        setNumRanges(numRanges + 1)

                        const oldSliderValues = sliderValues;

                        setSliderValues([...oldSliderValues, [minimum ?? 1, maximum ?? 1]]);
                        setIdRanges([...oldSliderValues, [minimum ?? 1, maximum ?? 1]].map(([start, end]) => ({ start, end })));
                        setInputStr([...oldSliderValues, [minimum ?? 1, maximum ?? 1]].map(([start, end]) => `${start}-${end}`).join(', '));
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

            <Divider />
        </>}
        <br />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ maxWidth: 700, color: PRIMARY_TEXT }}>
                <BadgeAvatarDisplay
                    collection={collection}
                    hideModalBalance
                    userBalance={getBlankBalance()}
                    badgeIds={sliderValues.map(([start, end]) => ({ start, end }))}
                    // selectedId={id}
                    size={40}
                    showIds={true}
                />
            </div>
        </div>

    </>
}

