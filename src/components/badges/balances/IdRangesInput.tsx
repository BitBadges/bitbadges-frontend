import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Divider, Input, InputNumber, Tooltip } from "antd";
import { UintRange } from "bitbadgesjs-proto";
import { Numberify, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useState } from "react";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";
import { SwitchForm } from "../../tx-timelines/form-items/SwitchForm";

export function UintRangesInput({
  uintRanges,
  setUintRanges,
  maximum,
  minimum,
  collectionId,
  hideSelect
}: {
  uintRanges?: UintRange<bigint>[],
  setUintRanges: (uintRanges: UintRange<bigint>[]) => void,
  maximum?: bigint,
  minimum?: bigint,
  collectionId: bigint,
  hideSelect?: boolean,
}) {
  // const isDefaultAllSelected = uintRanges ? uintRanges.length === 1 && uintRanges[0].start === minimum && uintRanges[0].end === maximum : defaultAllSelected;

  const [numRanges, setNumRanges] = useState(uintRanges ? uintRanges.length : 1);
  const [sliderValues, setSliderValues] = useState<[bigint, bigint][]>(
    uintRanges ? uintRanges.map(({ start, end }) => [start, end])
      : [[minimum ?? 1n, maximum ?? 1n]]);
  const [inputStr, setInputStr] = useState(
    uintRanges ?
      uintRanges.map(({ start, end }) => `${start}-${end}`).join(', ')
      : `${minimum ?? 1n}-${maximum ?? 1n}`);
  const [updateAllIsSelected, setUpdateAllIsSelected] = useState(false);
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
    {!hideSelect &&
      <SwitchForm
        options={switchOptions}
        onSwitchChange={(_idx, name) => {
          setUpdateAllIsSelected(name === 'All Badges');
          if (name === 'All Badges') {
            setUintRanges([{ start: minimum ?? 1n, end: maximum ?? 1n }]);
          }
        }}
      />}

    {!updateAllIsSelected && <>
      <br />
      <div className='flex-center' >
        <Input
          style={{ marginTop: 16, textAlign: 'center' }}
          className="primary-text primary-blue-bg"
          value={inputStr}
          placeholder="Enter Badge IDs: 1-10, 20-30, 40-50, ...."
          onChange={(e) => {
            setInputStr(e.target.value);
            try {
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
              setUintRanges(sliderValues.map(([start, end]) => ({ start, end })));
            } catch (err) {
              console.log(err);
            }
          }}

        />
      </div>
      <br />
      {/* <h2 style={{ textAlign: 'center',  }} className='primary-text'>Badge ID Select</h2> */}
      {
        new Array(numRanges).fill(0).map((_, i) => {
          return <div key={i} style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
            {/* <div className='flex-between' style={{ flexDirection: 'column', minWidth: 200, marginRight: 12 }} >
              <b>Select Badge IDs to {verb ? verb : 'Transfer'}</b>
              <Slider min={minimumNum} max={maximumNum} range
                style={{ minWidth: 200 }}
                value={[Numberify(sliderValues[i][0]), Numberify(sliderValues[i][1])]}
                onChange={(e) => {
                  const _newSliderValues = sliderValues.map((v, j) => i === j ? e : v);
                  const newSliderValues = _newSliderValues.map(([start, end]) => [BigInt(start), BigInt(end)]);
                  setSliderValues(newSliderValues.map(x => [BigInt(x[0]), BigInt(x[1])]));
                  setUintRanges(newSliderValues.map(([start, end]) => ({ start, end })));
                  setInputStr(newSliderValues.map(([start, end]) => `${start}-${end}`).join(', '));
                }}
              />
            </div> */}
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
                      setUintRanges(newSliderValues.map(([start, end]) => ({ start, end })));
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
                      setUintRanges(newSliderValues.map(([start, end]) => ({ start, end })));
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
                    cursor: 'pointer',
                  }}
                  onClick={() => {

                    setNumRanges(numRanges - 1);
                    setSliderValues(sliderValues.filter((_, j) => i !== j));
                    setUintRanges(sliderValues.filter((_, j) => i !== j).map(([start, end]) => ({ start, end })));
                    setInputStr(sliderValues.filter((_, j) => i !== j).map(([start, end]) => `${start}-${end}`).join(', '));

                  }}
                  disabled={numRanges === 1}
                />
              </Tooltip>
            </div>

          </div>
        })
      }


      <div className='flex-center'>
        <Tooltip title="Add Range" placement='bottom'>
          <PlusCircleOutlined
            style={{
              fontSize: 24, marginLeft: 20, marginTop: 16,
              cursor: 'pointer',
            }}
            onClick={() => {
              setNumRanges(numRanges + 1)

              const oldSliderValues = sliderValues;

              setSliderValues([...oldSliderValues, [minimum ?? 1n, maximum ?? 1n]]);
              setUintRanges([...oldSliderValues, [minimum ?? 1n, maximum ?? 1n]].map(([start, end]) => ({ start, end })));
              setInputStr([...oldSliderValues, [minimum ?? 1n, maximum ?? 1n]].map(([start, end]) => `${start}-${end}`).join(', '));
            }}
            disabled={numRanges === 1}
          />
        </Tooltip>

      </div>

      <br />
      <div className='flex-center'>
        {overlaps &&
          <Button type='primary'
            className="screen-button"
            onClick={() => {
              const newUintRanges = sortUintRangesAndMergeIfNecessary(sliderValues.map(([start, end]) => ({ start, end })));

              setNumRanges(newUintRanges.length);
              setSliderValues(newUintRanges.map(({ start, end }) => [start, end]));
              setUintRanges(newUintRanges);
              setInputStr(newUintRanges.map(({ start, end }) => [start, end]).map(([start, end]) => `${start}-${end}`).join(', '));
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

