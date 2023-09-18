import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Tooltip } from "antd";
import { UintRange } from "bitbadgesjs-proto";
import { Numberify, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useState } from "react";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm";

export function BadgeIdRangesInput({
  uintRanges,
  setUintRanges,
  maximum,
  minimum,
  collectionId,
  hideSelect,
  uintRangeBounds
}: {
  uintRanges: UintRange<bigint>[],
  setUintRanges: (uintRanges: UintRange<bigint>[]) => void,
  maximum?: bigint,
  minimum?: bigint,
  uintRangeBounds?: UintRange<bigint>[],
  collectionId: bigint,
  hideSelect?: boolean,
}) {
  uintRangeBounds = uintRangeBounds ? sortUintRangesAndMergeIfNecessary(uintRangeBounds) : undefined;

  const [numRanges, setNumRanges] = useState(uintRanges ? uintRanges.length : 1);
  const [sliderValues, setSliderValues] = useState<[bigint, bigint][]>(
    uintRanges ? uintRanges.map(({ start, end }) => [start, end])
      : uintRangeBounds ? uintRangeBounds.map(({ start, end }) => [start, end]) : [[minimum ?? 1n, maximum ?? 1n]]);
  const [inputStr, setInputStr] = useState(
    uintRanges ?

      uintRanges.map(({ start, end }) => `${start}-${end}`).join(', ')
      : uintRangeBounds ? uintRangeBounds.map(({ start, end }) => [start, end]).map(([start, end]) => `${start}-${end}`).join(', ')
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

  const maximumNum =
    uintRangeBounds && uintRangeBounds.length > 0 ?
      Numberify(uintRangeBounds[uintRangeBounds.length - 1].end.toString()) :
      Numberify(maximum?.toString() ?? 1);
  const minimumNum = uintRangeBounds && uintRangeBounds.length > 0 ?
    Numberify(uintRangeBounds[0].start.toString()) :
    Numberify(minimum?.toString() ?? 1);

  const [remaining] = removeUintRangeFromUintRange(uintRangeBounds ?? [], uintRanges ?? []);
  const outOfBounds = uintRangeBounds && remaining.length > 0;


  return <>
    {!hideSelect &&
      <SwitchForm
        options={switchOptions}
        onSwitchChange={(_idx, name) => {
          setUpdateAllIsSelected(name === 'All Badges');
          if (name === 'All Badges') {
            if (uintRangeBounds) setUintRanges(uintRangeBounds);
            else setUintRanges([{ start: minimum ?? 1n, end: maximum ?? 1n }]);
          }
        }}
      />}

    {!updateAllIsSelected && <>
      <br />
      <div className='flex-center full-width' >
        <Input
          style={{ marginTop: 16, textAlign: 'center' }}
          className="primary-text primary-blue-bg"
          value={inputStr}
          placeholder="Enter Badge IDs or Ranges: 1, 2-10, 11, 20-30, 40-50, ...."
          onChange={(e) => {
            setInputStr(e.target.value);
            try {
              let sliderValues: [bigint, bigint][] = [];

              const splitSliderValues = e.target.value.split(',').map(x => x.trim()).filter(x => x !== '');
              for (const sliderValue of splitSliderValues) {
                if (sliderValue.split('-').length !== 2) {
                  if (sliderValue.split('-').length === 1 && BigInt(sliderValue.split('-')[0]) > 0) {

                    sliderValues.push([BigInt(sliderValue.split('-')[0]), BigInt(sliderValue.split('-')[0])]);
                  } else {
                    continue;
                  }
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
                  className='styled-button'
                  style={{
                    fontSize: 24, marginLeft: 20, marginTop: 16,
                    cursor: 'pointer',
                    border: 'none'
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
              border: 'none'
            }}
            className='styled-button'
            onClick={() => {
              setNumRanges(numRanges + 1)

              const oldSliderValues = sliderValues;

              setSliderValues([...oldSliderValues, [minimum ?? (uintRangeBounds && uintRangeBounds.length > 0 ? uintRangeBounds[0].start : 1n), maximum ?? (uintRangeBounds && uintRangeBounds.length > 0 ? uintRangeBounds[0].end : 1n)]]);
              setUintRanges([...oldSliderValues, [minimum ?? (uintRangeBounds && uintRangeBounds.length > 0 ? uintRangeBounds[0].start : 1n), maximum ?? (uintRangeBounds && uintRangeBounds.length > 0 ? uintRangeBounds[0].end : 1n)]].map(([start, end]) => ({ start, end })));
              setInputStr([...oldSliderValues, [minimum ?? (uintRangeBounds && uintRangeBounds.length > 0 ? uintRangeBounds[0].start : 1n), maximum ?? (uintRangeBounds && uintRangeBounds.length > 0 ? uintRangeBounds[0].end : 1n)]].map(([start, end]) => `${start}-${end}`).join(', '));
            }}
            disabled={numRanges === 1}
          />
        </Tooltip>

      </div>

      <br />
      <div className='flex-center'>
        {overlaps &&
          <Button type='primary'
            className="styled-button"
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
          <br />
        </div>
      }
      {
        outOfBounds &&
        <div style={{ color: 'red', textAlign: 'center' }}>
          <b>You have selected some badges that are out of bounds. Please resolve this before continuing.</b>
          <br />
          <p>Out of Bounds IDs: {remaining?.map(({ start, end }) => `${start}-${end}`).join(', ')}</p>
          <br />
        </div>
      }
    </>}
    <br />
    <div className='flex-center full-width'>
      <div style={{}} className='primary-text full-width'>
        <BadgeAvatarDisplay
          collectionId={collectionId}
          badgeIds={sliderValues.map(([start, end]) => ({ start, end }))}
          showIds={true}
        />
      </div>
    </div>

  </>
}

