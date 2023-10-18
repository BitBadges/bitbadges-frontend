import { DeleteOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Row } from "antd";
import { Balance, UintRange, deepCopy } from "bitbadgesjs-proto";
import { checkIfUintRangesOverlap, invertUintRanges, isFullUintRanges, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { ReactNode, useState } from "react";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { MSG_PREVIEW_ID } from "../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates";
import { BalanceDisplay } from "../badges/balances/BalanceDisplay";
import IconButton from "../display/IconButton";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm";
import { BadgeIdRangesInput } from "./BadgeIdRangesInput";
import { DateRangeInput } from "./DateRangeInput";
import { NumberInput } from "./NumberInput";



export function BalanceDisplayEditRow({
  collectionId,
  onAddBadges,
  isMustOwnBadgesInput,
  minimum,
  maximum,
  message,
  defaultBalancesToShow,
  hideOwnershipTimeSelect,
  onRemoveAll,
  sequentialOnly,
  fullWidthCards
}: {
  collectionId: bigint;
  balances: Balance<bigint>[];
  numIncrements?: bigint
  incrementBadgeIdsBy?: bigint
  incrementOwnershipTimesBy?: bigint
  hideOwnershipTimeSelect?: boolean

  message?: string | ReactNode
  size?: number;
  showingSupplyPreview?: boolean;

  cardView?: boolean;
  hideMessage?: boolean;
  hideBadges?: boolean;
  floatToRight?: boolean;
  isMustOwnBadgesInput?: boolean
  editable?: boolean
  onAddBadges?: (balances: Balance<bigint>, amountRange?: UintRange<bigint>, collectionId?: bigint) => void,
  minimum?: bigint
  maximum?: bigint
  defaultBalancesToShow?: Balance<bigint>[],
  onRemoveAll?: () => void
  sequentialOnly?: boolean
  fullWidthCards?: boolean
}) {
  const collections = useCollectionsContext();
  const [selectIsVisible, setSelectIsVisible] = useState(false);
  const [currentSupply, setCurrentSupply] = useState<Balance<bigint>>({
    amount: 1n,
    badgeIds: [],
    ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }],
  });
  const [selectedCollectionId, setSelectedCollectionId] = useState<bigint>(1n);
  const [selectedAmountRange, setSelectedAmountRange] = useState<UintRange<bigint>>({ start: 1n, end: 1n });

  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours());
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  //Does current supply cause a gap
  let currBadgeIds = collections.collections[MSG_PREVIEW_ID.toString()]?.owners.find(x => x.cosmosAddress === "Total")?.balances?.map(x => x.badgeIds).flat() ?? [];
  currBadgeIds.push(...currentSupply.badgeIds);
  currBadgeIds = sortUintRangesAndMergeIfNecessary(currBadgeIds);
  let maxBadgeId = currBadgeIds.length > 0 ? currBadgeIds[currBadgeIds.length - 1].end : 0n;
  let invertedBadgeIds = invertUintRanges(currBadgeIds, 1n, maxBadgeId);

  const nonSequential = invertedBadgeIds.length > 0 && sequentialOnly;

  const isDisabled = currentSupply.amount <= 0 || currentSupply.badgeIds.length === 0 || currentSupply.ownershipTimes.length === 0
    || checkIfUintRangesOverlap(currentSupply.ownershipTimes) || checkIfUintRangesOverlap(currentSupply.badgeIds) || nonSequential;

  return <>
    <tr style={{ color: currentSupply.amount < 0 ? 'red' : undefined }}>
      <td colSpan={3} className='flex' style={{ textAlign: 'center', verticalAlign: "top", paddingRight: 4 }}>
        <div className='flex-center'>
          <IconButton
            src={!selectIsVisible ? <PlusOutlined size={40} /> : <MinusOutlined size={40} />}
            onClick={() => {
              setCurrentSupply({
                amount: 1n,
                badgeIds: [],
                ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }],
              });
              setSelectIsVisible(!selectIsVisible)
            }}
            text={!selectIsVisible ? 'Add Badges' : 'Cancel'}
            size={40}
          />
        </div>
        {!selectIsVisible &&
          <div className='flex-center'>
            <IconButton
              src={<DeleteOutlined size={40} />}
              onClick={() => {
                onRemoveAll?.();
              }}
              text='Delete All'
              tooltipMessage="Delete All Added Badges"
              size={40}
            />
          </div>}

      </td>
    </tr>
    {selectIsVisible && <>
      <Row className="flex-between full-width" style={{ marginTop: 24, alignItems: 'normal' }}>
        {isMustOwnBadgesInput &&
          <InformationDisplayCard md={fullWidthCards ? 24 : 4} xs={24} sm={24} style={{ marginTop: 16 }} title={'Collection ID'}>
            <br />
            <NumberInput
              value={Number(selectedCollectionId)}
              setValue={(value) => {
                // currentSupply.amount = BigInt(value);
                setSelectedCollectionId(BigInt(value))
              }}
              title='Collection ID'
              min={1}
              max={Number.MAX_SAFE_INTEGER}
            />

          </InformationDisplayCard>}
        {isMustOwnBadgesInput &&
          <InformationDisplayCard md={fullWidthCards ? 24 : 4} xs={24} sm={24} style={{ marginTop: 16 }} title={'Amount Range'}>
            <br />
            <NumberInput
              value={Number(selectedAmountRange.start)}
              setValue={(value) => {
                // currentSupply.amount = BigInt(value);
                setSelectedAmountRange((selectedAmountRange) => {
                  return {
                    ...selectedAmountRange,
                    start: BigInt(value)
                  }
                })
              }}
              title='Min Amount'
              min={0}
              max={Number.MAX_SAFE_INTEGER}
            />
            <NumberInput
              value={Number(selectedAmountRange.end)}
              setValue={(value) => {
                // currentSupply.amount = BigInt(value);
                setSelectedAmountRange((selectedAmountRange) => {
                  return {
                    ...selectedAmountRange,
                    end: BigInt(value)
                  }
                })
              }}
              title='Max Amount'
              min={0}
              max={Number.MAX_SAFE_INTEGER}
            />

          </InformationDisplayCard>}
        {!isMustOwnBadgesInput &&
          <InformationDisplayCard md={fullWidthCards ? 24 : 4} xs={24} sm={24} style={{ marginTop: 16 }} title={'Amount'}>
            <br />
            <NumberInput
              value={Number(currentSupply.amount)}
              setValue={(value) => {
                // currentSupply.amount = BigInt(value);
                setCurrentSupply((currentSupply) => {
                  return {
                    ...currentSupply,
                    amount: BigInt(value)
                  }
                })
              }}
              title='Amount'
              min={0}
              max={Number.MAX_SAFE_INTEGER}
            />

          </InformationDisplayCard>}
        <InformationDisplayCard md={fullWidthCards ? 24 : 10} xs={24} sm={24} style={{ marginTop: 16 }} title={'Badge IDs'}>
          <br />
          <BadgeIdRangesInput
            uintRanges={currentSupply.badgeIds}
            setUintRanges={(uintRanges) => {
              setCurrentSupply((currentSupply) => {
                return {
                  ...currentSupply,
                  badgeIds: uintRanges
                }
              })
            }}
            minimum={minimum ?? 1n}
            maximum={maximum ?? 100000n}
            collectionId={isMustOwnBadgesInput ? selectedCollectionId : collectionId}
            hideSelect
            hideNumberSelects
          />

        </InformationDisplayCard>
        <InformationDisplayCard md={fullWidthCards ? 24 : 9} xs={24} sm={24} style={{ marginTop: 16 }} title={'Ownership Times'}>
          <br />
          {isMustOwnBadgesInput ? 'Transfer Time' :
            hideOwnershipTimeSelect ? <><b>Select Ownership Times</b><br />
              {getTimeRangesElement(currentSupply.ownershipTimes, '', true)}
            </> :
              <>
                <b>Select Ownership Times</b>
                <div>
                  <SwitchForm
                    fullWidthCards
                    options={[
                      {
                        title: "All Times",
                        message: message == "Circulating Supplys" ? "Badges can be owned at all times." : "Ownership of the selected badges is to be transferred for all times.",
                        isSelected: isFullUintRanges(currentSupply.ownershipTimes),

                      },
                      {
                        title: "Custom",
                        message: message == "Circulating Supplys" ? "Badges can be owned only at custom times." : "Ownership of the selected badges is to be transferred only for custom times.",
                        isSelected: !(isFullUintRanges(currentSupply.ownershipTimes)),
                        additionalNode: <>
                          {isFullUintRanges(currentSupply.ownershipTimes) ? <></> : <>

                            <DateRangeInput
                              timeRanges={currentSupply.ownershipTimes}
                              setTimeRanges={(timeRanges) => {
                                setCurrentSupply({ ...currentSupply, ownershipTimes: timeRanges });
                              }}
                              suggestedTimeRanges={defaultBalancesToShow?.map(x => x.ownershipTimes).flat()}
                            />
                          </>}</>
                      },
                    ]}
                    onSwitchChange={(value) => {
                      if (value === 0) {
                        setCurrentSupply({
                          ...currentSupply,
                          ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        });
                      } else {
                        setCurrentSupply({
                          ...currentSupply,
                          ownershipTimes: [],
                        });
                      }
                    }}
                  />
                </div>
              </>

          }
        </InformationDisplayCard>
      </Row>
      {!isDisabled && !isMustOwnBadgesInput &&
        <Row className="flex-between full-width" style={{ marginTop: 24, alignItems: 'normal' }}>
          <InformationDisplayCard md={fullWidthCards ? 24 : 24} xs={24} sm={24} style={{}} title={''}>
            <BalanceDisplay
              collectionId={collectionId}
              balances={!isDisabled ? deepCopy([currentSupply]) : []}
              message={'Badges to Add'}
              hideOwnershipTimeSelect={hideOwnershipTimeSelect}
              isMustOwnBadgesInput={isMustOwnBadgesInput}
              editable={false}
              hideBadges
            />
          </InformationDisplayCard>
        </Row>}
      <br />
      <div style={{ textAlign: 'center', verticalAlign: "top", paddingRight: 4 }} className="full-width">
        <button
          className='landing-button full-width'
          style={{ width: '100%' }}
          disabled={isDisabled}
          onClick={() => {
            if (isMustOwnBadgesInput) {
              onAddBadges?.(deepCopy(currentSupply), selectedAmountRange, selectedCollectionId);
            } else {
              onAddBadges?.(deepCopy(currentSupply));
            }

            setCurrentSupply({
              amount: 1n,
              badgeIds: [],
              ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }],
            });

            setSelectIsVisible(false);
          }}
        >
          Add Badges
        </button>
        <span style={{ color: 'red' }}>{isDisabled && nonSequential ? 'Badge IDs must be sequential starting from 1 (no gaps).' : isDisabled ? 'All options must be non-empty and have no errors.' : ''}</span>
      </div>
    </>
    }
  </>
}