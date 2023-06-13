import { DeleteOutlined } from "@ant-design/icons";
import { Button, Divider, Input, InputNumber, Slider, Tooltip } from "antd";
import { IdRange } from "bitbadgesjs-proto";
import { Numberify, sortIdRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useState } from "react";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm";

export function IdRangesInput({
  idRanges,
  setIdRanges,
  maximum,
  minimum,
  verb,
  collectionId,
  defaultAllSelected = true,
}: {
  idRanges?: IdRange<bigint>[],
  setIdRanges: (idRanges: IdRange<bigint>[]) => void,
  maximum?: bigint,
  minimum?: bigint,
  verb?: string,
  collectionId: bigint,
  defaultAllSelected?: boolean,
}) {
  const isDefaultAllSelected = idRanges ? idRanges.length === 1 && idRanges[0].start === minimum && idRanges[0].end === maximum : defaultAllSelected;

  const [numRanges, setNumRanges] = useState(idRanges ? idRanges.length : 1);
  const [sliderValues, setSliderValues] = useState<[bigint, bigint][]>(
    idRanges ? idRanges.map(({ start, end }) => [start, end])
      : [[minimum ?? 1n, maximum ?? 1n]]);
  const [inputStr, setInputStr] = useState(
    idRanges ?
      idRanges.map(({ start, end }) => `${start}-${end}`).join(', ')
      : `${minimum ?? 1n}-${maximum ?? 1n}`);
  const [updateAllIsSelected, setUpdateAllIsSelected] = useState(isDefaultAllSelected);
  // const [clicked, setClicked] = useState(false);

  if (maximum && maximum <= 0) {
    return null;
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
  if (maximum !== 1n) {
    switchOptions.push({
      title: 'Custom',
      message: `Select specific badges.`,
      isSelected: !updateAllIsSelected,
    });
  }

  switchOptions.push({
    title: 'All Badges',
    message: `Select all badges in this collection. ${maximum === 1n ? 'This is auto-selected because there is only one badge.' : ''}`,
    isSelected: updateAllIsSelected,
  });

  const maximumNum = Numberify(maximum?.toString() ?? 1);
  const minimumNum = Numberify(minimum?.toString() ?? 1);


  return <>
    <SwitchForm
      options={switchOptions}
      onSwitchChange={(_idx, name) => {
        setUpdateAllIsSelected(name === 'All Badges');
        if (name === 'All Badges') {
          setIdRanges([{ start: minimum ?? 1n, end: maximum ?? 1n }]);
        }
      }}
    />

    {!updateAllIsSelected && <>
      <br />
      <div className='flex-center' >
        <Input
          style={{ width: 750, marginTop: 16, textAlign: 'center' }}
          className="primary-text primary-blue-bg"
          value={inputStr}
          onChange={(e) => {
            setInputStr(e.target.value);
            let sliderValues: [bigint, bigint][] = [];

            const splitSliderValues = e.target.value.split(', ');
            for (const sliderValue of splitSliderValues) {
              if (sliderValue.split('-').length !== 2) {
                continue;
              } else {

                if (sliderValue.split('-')[0] === '' || sliderValue.split('-')[1] === '') {
                  continue;
                }
                //start can't be greater than end
                if (BigInt(sliderValue.split('-')[0]) > BigInt(sliderValue.split('-')[1])) {
                  continue;
                }

                sliderValues.push([BigInt(sliderValue.split('-')[0]), BigInt(sliderValue.split('-')[1])]);
              }
            }

            setSliderValues(sliderValues);
            setNumRanges(sliderValues.length);
            setIdRanges(sliderValues.map(([start, end]) => ({ start, end })));
          }}

        />
      </div>
      <br />
      {/* <h2 style={{ textAlign: 'center',  }} className='primary-text'>Badge ID Select</h2> */}
      {
        new Array(numRanges).fill(0).map((_, i) => {
          return <div key={i} style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
            <div className='flex-between' style={{ flexDirection: 'column', minWidth: 500, marginRight: 12 }} >
              <b>Select Badge IDs to {verb ? verb : 'Transfer'}</b>
              <Slider min={minimumNum} max={maximumNum} range
                style={{ minWidth: 500 }}
                value={[Numberify(sliderValues[i][0]), Numberify(sliderValues[i][1])]}
                onChange={(e) => {
                  const _newSliderValues = sliderValues.map((v, j) => i === j ? e : v);
                  const newSliderValues = _newSliderValues.map(([start, end]) => [BigInt(start), BigInt(end)]);
                  setSliderValues(newSliderValues.map(x => [BigInt(x[0]), BigInt(x[1])]));
                  setIdRanges(newSliderValues.map(([start, end]) => ({ start, end })));
                  setInputStr(newSliderValues.map(([start, end]) => `${start}-${end}`).join(', '));
                }}
              />
            </div>
            <div className='flex-between' style={{ flexDirection: 'column', marginRight: 8 }} >
              <b>Start</b>
              <InputNumber
                min={minimumNum}
                max={Numberify(sliderValues[i][1])}
                value={Numberify(sliderValues[i][0])}
                onChange={
                  (value: number) => {
                    if (value >= 0 && value <= sliderValues[i][1]) {
                      const _newSliderValues = sliderValues.map((v, j) => i === j ? [value, v[1]] : v);
                      const newSliderValues = _newSliderValues.map(([start, end]) => [BigInt(start), BigInt(end)]);
                      setSliderValues(newSliderValues.map(x => [BigInt(x[0]), BigInt(x[1])]));
                      setIdRanges(newSliderValues.map(([start, end]) => ({ start, end })));
                      setInputStr(newSliderValues.map(([start, end]) => `${start}-${end}`).join(', '));
                    }
                  }
                }
                className="primary-text primary-blue-bg"
              />
            </div>
            <div className='flex-between' style={{ flexDirection: 'column' }} >
              <b>End</b>
              <InputNumber
                min={minimumNum}
                max={maximumNum}
                title='Amount to Transfer'
                value={Numberify(sliderValues[i][1])}
                onChange={
                  (value: number) => {
                    if (value >= 0 && value >= sliderValues[i][0]) {
                      const _newSliderValues = sliderValues.map((v, j) => i === j ? [v[0], value] : v);
                      const newSliderValues = _newSliderValues.map(([start, end]) => [BigInt(start), BigInt(end)]);
                      setSliderValues(newSliderValues.map(x => [BigInt(x[0]), BigInt(x[1])]));
                      setIdRanges(newSliderValues.map(([start, end]) => ({ start, end })));
                      setInputStr(newSliderValues.map(([start, end]) => `${start}-${end}`).join(', '));
                    }
                  }
                }
                className="primary-text primary-blue-bg"
              />
            </div>
            <div className='flex' >
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
      <div className='flex-center'>
        <Button type='primary'
          style={{ marginRight: 12 }}
          onClick={() => {
            setNumRanges(numRanges + 1)

            const oldSliderValues = sliderValues;

            setSliderValues([...oldSliderValues, [minimum ?? 1n, maximum ?? 1n]]);
            setIdRanges([...oldSliderValues, [minimum ?? 1n, maximum ?? 1n]].map(([start, end]) => ({ start, end })));
            setInputStr([...oldSliderValues, [minimum ?? 1n, maximum ?? 1n]].map(([start, end]) => `${start}-${end}`).join(', '));
          }}>
          Add Range
        </Button>
        {overlaps &&
          <Button type='primary'
            onClick={() => {
              const newIdRanges = sortIdRangesAndMergeIfNecessary(sliderValues.map(([start, end]) => ({ start, end })));
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
    <div className='flex-center'>
      <div style={{ maxWidth: 700 }} className='primary-text'>
        <BadgeAvatarDisplay
          collectionId={collectionId}
          badgeIds={sliderValues.map(([start, end]) => ({ start, end }))}
          showIds={true}
        />
      </div>
    </div>

  </>
}

