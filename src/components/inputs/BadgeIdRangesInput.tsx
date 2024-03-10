import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Input, Switch } from 'antd';
import { TransferWithIncrements, UintRange, UintRangeArray, getAllBadgeIdsToBeTransferred } from 'bitbadgesjs-sdk';
import { useState } from 'react';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { ErrDisplay } from '../common/ErrDisplay';
import { TableRow } from '../display/TableRow';
import { NumberInput } from './NumberInput';

export const BadgeIDSelectWithSwitch = ({
  message,
  hideBadges,
  disabled,
  collectionId,
  uintRanges,
  setUintRanges,
  incrementBadgeIdsBy,
  setIncrementBadgeIdsBy,
  numRecipients,
  setNumRecipients
}: {
  message?: string;
  hideBadges?: boolean;
  disabled?: boolean;
  collectionId: bigint;
  uintRanges: UintRangeArray<bigint>;
  setUintRanges: (uintRanges: UintRangeArray<bigint>) => void;
  incrementBadgeIdsBy?: bigint;
  setIncrementBadgeIdsBy?: (incrementBadgeIdsBy: bigint) => void;
  numRecipients?: bigint;
  setNumRecipients?: (numRecipients: bigint) => void;
}) => {
  return (
    <>
      <div className="flex-center flex-column full-width" style={{ textAlign: 'center' }}>
        <Switch
          checked={uintRanges.isFull()}
          disabled={disabled}
          checkedChildren="All Badges"
          unCheckedChildren="Custom"
          onChange={(checked) => {
            if (checked) {
              setUintRanges(UintRangeArray.FullRanges());
            } else {
              setUintRanges(new UintRangeArray());
            }
            setIncrementBadgeIdsBy?.(0n);
          }}
        />
        <br />
        {uintRanges.isFull() && (
          <div className="secondary-text">
            <InfoCircleOutlined /> {uintRanges.isFull() && 'All IDs are selected, even IDs that may have not been created yet.'}
          </div>
        )}
        <br />
        <>
          {uintRanges.isFull() ? (
            <></>
          ) : (
            <>
              <BadgeIdRangesInput
                message={message}
                uintRangeBounds={UintRangeArray.FullRanges()}
                collectionId={collectionId}
                uintRanges={uintRanges}
                setUintRanges={setUintRanges}
                hideDisplay={hideBadges}
                incrementBadgeIdsBy={incrementBadgeIdsBy}
                setIncrementBadgeIdsBy={setIncrementBadgeIdsBy}
                numRecipients={numRecipients}
                setNumRecipients={setNumRecipients}
              />
            </>
          )}
        </>
      </div>
    </>
  );
};

export function BadgeIdRangesInput({
  uintRanges,
  setUintRanges,
  maximum,
  minimum,
  collectionId,
  uintRangeBounds = UintRangeArray.FullRanges(),
  hideDisplay,
  suggestedRanges,
  message,
  incrementBadgeIdsBy = 0n,
  setIncrementBadgeIdsBy,
  numRecipients = 1n,
  setNumRecipients
}: {
  uintRanges: UintRangeArray<bigint>;
  setUintRanges: (uintRanges: UintRangeArray<bigint>) => void;
  maximum?: bigint;
  minimum?: bigint;
  uintRangeBounds?: UintRangeArray<bigint>;
  collectionId: bigint;
  hideDisplay?: boolean;
  suggestedRanges?: UintRangeArray<bigint>;
  message?: string;
  incrementBadgeIdsBy?: bigint;
  setIncrementBadgeIdsBy?: (incrementBadgeIdsBy: bigint) => void;
  numRecipients?: bigint;
  setNumRecipients?: (numRecipients: bigint) => void;
}) {
  uintRangeBounds = uintRangeBounds.sortAndMerge();
  const collection = useCollection(collectionId);
  suggestedRanges = suggestedRanges ?? new UintRangeArray();

  if (collection) suggestedRanges?.unshift(...collection.getBadgeIdRange());
  suggestedRanges?.unshift({ start: 1n, end: 1n });
  suggestedRanges =
    suggestedRanges?.filter((suggestedRange) => {
      return suggestedRange.start <= suggestedRange.end;
    }) ?? [];
  suggestedRanges = suggestedRanges?.filter((x, idx, self) => {
    return self.findIndex((y) => y.start === x.start && y.end === x.end) === idx;
  });

  const totalNumberOfBadges = collection ? collection.getMaxBadgeId() : 0n;

  const [inputStr, setInputStr] = useState(
    uintRanges
      ? uintRanges.map(({ start, end }) => `${start}-${end}`).join(', ')
      : uintRangeBounds
        ? uintRangeBounds
            .map(({ start, end }) => [start, end])
            .map(([start, end]) => `${start}-${end}`)
            .join(', ')
        : `${minimum ?? 1n}-${maximum ?? 1n}`
  );
  const firstRange = uintRanges.length > 0 ? uintRanges[0] : undefined;
  const differentSizeRanges = uintRanges.length > 1 && uintRanges.slice(1).some((x) => x.size() !== firstRange?.size());

  const setUintRangesWrapper = (uintRanges: UintRangeArray<bigint>) => {
    setUintRanges(uintRanges);

    if (!setIncrementBadgeIdsBy) return;
    const differentSizeRanges = uintRanges.length > 1 && uintRanges.slice(1).some((x) => x.size() !== firstRange?.size());
    if (differentSizeRanges) {
      setIncrementBadgeIdsBy?.(0n);
    } else if (incrementBadgeIdsBy) {
      setIncrementBadgeIdsBy?.(uintRanges.length > 0 ? uintRanges[0].size() : 0n);
    }
  };

  if (maximum && maximum <= 0) {
    return null;
  }

  const overlaps = uintRanges.hasOverlaps();

  const [remaining] = uintRanges.getOverlapDetails(uintRangeBounds);
  const outOfBounds = uintRangeBounds && remaining.length > 0;

  const AvatarDisplay = (
    <>
      {!hideDisplay && (
        <>
          {uintRanges.length == 0 && (
            <div className="flex-center" style={{ color: 'red' }}>
              None
            </div>
          )}
          {uintRanges.length > 0 && (
            <div className="flex-center full-width">
              <div className="primary-text full-width">
                <BadgeAvatarDisplay
                  collectionId={collectionId}
                  badgeIds={getAllBadgeIdsToBeTransferred([
                    new TransferWithIncrements({
                      from: 'Mint',
                      toAddressesLength: numRecipients,
                      toAddresses: [],
                      balances: [
                        {
                          amount: 1n,
                          badgeIds: uintRanges,
                          ownershipTimes: UintRange.FullRanges()
                        }
                      ],
                      incrementBadgeIdsBy,
                      incrementOwnershipTimesBy: 0n
                    })
                  ])}
                  showIds={true}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  const CustomInput = (
    <>
      {
        <>
          <b>{message ?? 'Select Badge IDs'}</b>
          <div className="flex-center full-width">
            <Input
              style={{ textAlign: 'center' }}
              className="primary-text inherit-bg"
              value={inputStr}
              placeholder="Ex: 1-5, 7-10, 11, 20-30, 40-50, ...."
              onChange={(e) => {
                setInputStr(e.target.value);
                try {
                  const sliderValues: Array<[bigint, bigint]> = [];

                  const splitSliderValues = e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter((x) => x !== '');
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

                  setUintRangesWrapper(UintRangeArray.From(sliderValues.map(([start, end]) => ({ start, end }))));
                } catch (err) {
                  console.log(err);
                }
              }}
            />
          </div>
          {totalNumberOfBadges > 0 && (
            <div className="secondary-text" style={{ textAlign: 'center', fontSize: 12 }}>
              <InfoCircleOutlined /> Created IDs for this collection: 1-
              {totalNumberOfBadges.toString()}
            </div>
          )}
          {!inputStr && suggestedRanges && suggestedRanges.length > 0 && (
            <>
              <div className="secondary-text" style={{ textAlign: 'center', fontSize: 12 }}>
                <b>Suggested (Start ID - End ID)</b>
                <br />
                <div className="flex-center flex-wrap">
                  {suggestedRanges.map(({ start, end }) => {
                    return (
                      <Button
                        key={`${start}-${end}`}
                        className="styled-icon-button"
                        style={{ margin: 4 }}
                        onClick={() => {
                          setUintRangesWrapper(UintRangeArray.From([...uintRanges, { start, end }]));
                          setInputStr(getBadgeIdsString([...uintRanges, { start, end }]));
                        }}>
                        {start.toString()} - {end.toString()}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <br />
            </>
          )}

          {overlaps && (
            <div style={{ color: 'red', textAlign: 'center' }}>
              <br />
              <b>Overlapping ranges are not allowed.</b>
              <br />
            </div>
          )}

          <div className="flex-center">
            {overlaps && (
              <>
                <Button
                  type="primary"
                  style={{ width: 200 }}
                  className="landing-button mt-4"
                  onClick={() => {
                    const newUintRanges = uintRanges.clone().sortAndMerge();
                    setUintRangesWrapper(newUintRanges);
                    setInputStr(
                      newUintRanges
                        .map(({ start, end }) => [start, end])
                        .map(([start, end]) => `${start}-${end}`)
                        .join(', ')
                    );
                  }}>
                  Sort and Remove Overlaps
                </Button>
              </>
            )}
          </div>

          {outOfBounds && (
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>You have selected some badges that are out of bounds. Please resolve this before continuing.</b>
              <br />
              <p>Out of Bounds IDs: {remaining?.map(({ start, end }) => `${start}-${end}`).join(', ')}</p>
              <br />
            </div>
          )}
          {setIncrementBadgeIdsBy && setNumRecipients && uintRanges.length > 0 && (
            <>
              <br />

              <div className="text-center">{!setNumRecipients && <b>{numRecipients.toString()} Recipients</b>}</div>
              <TableRow
                label={`Increments of x${firstRange?.size()}?`}
                labelSpan={18}
                valueSpan={6}
                value={
                  <Switch
                    disabled={differentSizeRanges}
                    checked={!!incrementBadgeIdsBy}
                    onChange={(checked) => setIncrementBadgeIdsBy(checked ? firstRange?.size() ?? 0n : 0n)}
                  />
                }
              />

              {setNumRecipients && !!incrementBadgeIdsBy && (
                <div className="text-center mt-2">
                  <NumberInput title="Increments" value={Number(numRecipients)} setValue={(value) => setNumRecipients(BigInt(value))} min={1} />
                  <br />
                </div>
              )}
              <TableRow
                label={
                  <div className="secondary-text">
                    {differentSizeRanges && (
                      <ErrDisplay warning={true} err="All ranges must be the same size (e.g. 1-10, 11-20) to use the increment feature." />
                    )}
                    {!differentSizeRanges && !incrementBadgeIdsBy && `Each will be for the same IDs ${getBadgeIdsString(uintRanges)}.`}
                    {!!incrementBadgeIdsBy &&
                      !differentSizeRanges &&
                      `The first increment will be for ID(s) ${getBadgeIdsString(uintRanges)}.${
                        numRecipients > 1n
                          ? ` The next increment will be for ID(s) ${getBadgeIdsString(
                              uintRanges.map((x) => {
                                return new UintRange<bigint>({
                                  start: x.start + incrementBadgeIdsBy,
                                  end: x.end + incrementBadgeIdsBy
                                });
                              })
                            )}, and so on${
                              numRecipients > 2n
                                ? ` up to increment #${numRecipients.toString()} for ID(s) ${getBadgeIdsString(
                                    uintRanges.map((x) => {
                                      return new UintRange<bigint>({
                                        start: x.start + incrementBadgeIdsBy * (numRecipients - 1n),
                                        end: x.end + incrementBadgeIdsBy * (numRecipients - 1n)
                                      });
                                    })
                                  )}.`
                                : '.'
                            }`
                          : ''
                      }`}
                  </div>
                }
                labelSpan={24}
                valueSpan={0}
                value={null}
              />
            </>
          )}
        </>
      }
    </>
  );

  return (
    <>
      {CustomInput}
      <br />
      {AvatarDisplay}
    </>
  );
}
