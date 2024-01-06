import {
  DeleteOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import { Row, Switch } from "antd"
import { Balance, UintRange, deepCopy } from "bitbadgesjs-proto"
import {
  checkIfUintRangesOverlap,
  getTotalNumberOfBadgeIds,
  invertUintRanges,
  isFullUintRanges,
  sortUintRangesAndMergeIfNecessary,
} from "bitbadgesjs-utils"
import { ReactNode, useState } from "react"

import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { getBadgeIdsString } from "../../utils/badgeIds"
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates"
import { ErrDisplay } from "../common/ErrDisplay"
import IconButton from "../display/IconButton"
import { InformationDisplayCard } from "../display/InformationDisplayCard"
import { BadgeIdRangesInput } from "../inputs/BadgeIdRangesInput"
import { DateRangeInput } from "../inputs/DateRangeInput"
import { NumberInput } from "../inputs/NumberInput"
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm"
import { BalanceDisplay } from "./BalanceDisplay"

export function BalanceDisplayEditRow({
  suggestedBalances,
  noOffChainBalances,
  collectionId,
  onAddBadges,
  isMustOwnBadgesInput,
  message,
  defaultBalancesToShow,
  hideOwnershipTimeSelect,
  onRemoveAll,
  sequentialOnly,
  fullWidthCards,
  numRecipients = 0n,
  incrementBadgeIdsBy = 0n,
  setIncrementBadgeIdsBy,
  timeString,
}: {
  collectionId: bigint
  balances: Balance<bigint>[]
  numIncrements?: bigint
  incrementBadgeIdsBy?: bigint
  incrementOwnershipTimesBy?: bigint
  hideOwnershipTimeSelect?: boolean
  numRecipients?: bigint

  message?: string | ReactNode
  size?: number
  showingSupplyPreview?: boolean
  noOffChainBalances?: boolean
  hideMessage?: boolean
  hideBadges?: boolean
  floatToRight?: boolean
  isMustOwnBadgesInput?: boolean
  editable?: boolean
  onAddBadges?: (
    balances: Balance<bigint>,
    amountRange?: UintRange<bigint>,
    collectionId?: bigint,
    mustOwnAll?: boolean
  ) => void
  defaultBalancesToShow?: Balance<bigint>[]
  onRemoveAll?: () => void
  sequentialOnly?: boolean
  fullWidthCards?: boolean
  setIncrementBadgeIdsBy?: (value: bigint) => void
  timeString?: string
  suggestedBalances?: Balance<bigint>[]
}) {
  const [selectIsVisible, setSelectIsVisible] = useState(false)
  const [mustOwnAll, setMustOwnAll] = useState(true)
  const [currentSupply, setCurrentSupply] = useState<Balance<bigint>>({
    amount: 1n,
    badgeIds: [],
    ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }],
  })
  const [selectedCollectionId, setSelectedCollectionId] = useState<bigint>(1n)
  const [selectedAmountRange, setSelectedAmountRange] = useState<UintRange<bigint>>({ start: 1n, end: 1n })

  const collection = useCollection(collectionId)
  const selectedCollection = useCollection(selectedCollectionId)

  const currTimeNextHour = new Date()
  currTimeNextHour.setHours(currTimeNextHour.getHours())
  currTimeNextHour.setMinutes(0)
  currTimeNextHour.setSeconds(0)
  currTimeNextHour.setMilliseconds(0)

  //Does current badges to add cause a gap in IDs
  let nonSequential = false
  if (sequentialOnly) {
    let currBadgeIds = collection?.owners.find((x) => x.cosmosAddress === "Total")
      ?.balances?.map((x) => x.badgeIds).flat() ?? []
    currBadgeIds.push(...currentSupply.badgeIds)
    currBadgeIds = sortUintRangesAndMergeIfNecessary(currBadgeIds, true)
    let maxBadgeId =
      currBadgeIds.length > 0 ? currBadgeIds[currBadgeIds.length - 1].end : 0n
    let invertedBadgeIds = invertUintRanges(currBadgeIds, 1n, maxBadgeId)
    nonSequential = invertedBadgeIds.length > 0 && sequentialOnly
  }


  const isDisabled = currentSupply.amount <= 0 ||
    currentSupply.badgeIds.length === 0 ||
    currentSupply.ownershipTimes.length === 0 ||
    checkIfUintRangesOverlap(currentSupply.ownershipTimes) ||
    checkIfUintRangesOverlap(currentSupply.badgeIds) ||
    nonSequential ||
    (isMustOwnBadgesInput && selectedCollection?.balancesType !== 'Standard' && noOffChainBalances)

  
  return (
    <>
      <tr style={{ color: currentSupply.amount < 0 ? "red" : undefined }}>
        <td
          colSpan={3}
          className="flex"
          style={{ textAlign: "center", verticalAlign: "top", paddingRight: 4 }}
        >
          <div className="flex-center">
            <IconButton
              src={
                !selectIsVisible ? (
                  <PlusOutlined size={40} />
                ) : (
                  <MinusOutlined size={40} />
                )
              }
              onClick={() => {
                setCurrentSupply({
                  amount: 1n,
                  badgeIds: [],
                  ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }],
                })
                setSelectIsVisible(!selectIsVisible)
              }}
              text={!selectIsVisible ? "Add Badges" : "Cancel"}
              size={40}
            />
          </div>
          {!selectIsVisible && (
            <div className="flex-center">
              <IconButton
                src={<DeleteOutlined size={40} />}
                onClick={() => {
                  onRemoveAll?.()
                }}
                text="Delete All"
                tooltipMessage="Delete All Added Badges"
                size={40}
              />
            </div>
          )}
        </td>
      </tr>
      {selectIsVisible && (
        <>
          <Row
            className="flex-between full-width"
            style={{ marginTop: 24, alignItems: "normal" }}
          >
            {isMustOwnBadgesInput && (
              <InformationDisplayCard
                md={fullWidthCards ? 24 : 4}
                xs={24}
                sm={24}
                style={{ marginTop: 16 }}
                title={"Collection ID"}
              >
                <br />
                <NumberInput
                  value={Number(selectedCollectionId)}
                  setValue={(value) => {
                    setSelectedCollectionId(BigInt(value))
                  }}
                  title="Collection ID"
                  min={1}
                  max={Number.MAX_SAFE_INTEGER}
                />
                {selectedCollection?.balancesType !== 'Standard' && noOffChainBalances && <ErrDisplay err="Only collections with on-chain balances are supported." />}
              </InformationDisplayCard>
            )}

            {isMustOwnBadgesInput && (
              <InformationDisplayCard
                md={fullWidthCards ? 24 : 4}
                xs={24}
                sm={24}
                style={{ marginTop: 16 }}
                title={"Amount Range"}
              >
                <br />
                <NumberInput
                  value={Number(selectedAmountRange.start)}
                  setValue={(value) => {
                    setSelectedAmountRange((selectedAmountRange) => {
                      return {
                        ...selectedAmountRange,
                        start: BigInt(value),
                      }
                    })
                  }}
                  title="Min Amount"
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
                        end: BigInt(value),
                      }
                    })
                  }}
                  title="Max Amount"
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                />


              </InformationDisplayCard>
            )}

            {!isMustOwnBadgesInput && (
              <InformationDisplayCard
                md={fullWidthCards ? 24 : 4}
                xs={24}
                sm={24}
                style={{ marginTop: 16 }}
                title={"Amount"}
              >
                <br />
                <NumberInput
                  value={Number(currentSupply.amount)}
                  setValue={(value) => {
                    setCurrentSupply((currentSupply) => {
                      return {
                        ...currentSupply,
                        amount: BigInt(value),
                      }
                    })
                  }}
                  title="Amount"
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                />
              </InformationDisplayCard>
            )}
            <InformationDisplayCard
              md={fullWidthCards ? 24 : 10}
              xs={24}
              sm={24}
              style={{ marginTop: 16 }}
              title={"Badge IDs"}
            >
              <br />
              {collection && (
                <BadgeIdRangesInput
                  suggestedRanges={
                    [
                      ...(suggestedBalances?.map((x) => x.badgeIds).flat() ??
                        []),
                      {
                        start: 1n,
                        end: getMaxBadgeIdForCollection(collection) ?? 0n,
                      },
                    ] ?? []
                  }
                  uintRanges={currentSupply.badgeIds}
                  setUintRanges={(uintRanges) => {
                    setCurrentSupply((currentSupply) => {
                      return {
                        ...currentSupply,
                        badgeIds: uintRanges,
                      }
                    })
                  }}
                  collectionId={
                    isMustOwnBadgesInput ? selectedCollectionId : collectionId
                  }
                />
              )}
            </InformationDisplayCard>
            {isMustOwnBadgesInput && getTotalNumberOfBadgeIds(currentSupply.badgeIds) > 1n && (
              <InformationDisplayCard
                md={fullWidthCards ? 24 : 4}
                xs={24}
                sm={24}
                style={{ marginTop: 16 }}
                title={"Requirements"}
              >
                <Switch
                  checkedChildren="Must Own All"
                  unCheckedChildren="Must Own One"
                  checked={mustOwnAll}
                  onChange={(checked) => {
                    setMustOwnAll(checked)
                  }}
                />
                <br />
                <div className="secondary-text">
                  <InfoCircleOutlined />{" "}
                  {mustOwnAll
                    ? "To be approved, the requirements for ALL selected badges must be met."
                    : "To be approved, the requirements for ONE of the selected badges must be met."}
                </div>
              </InformationDisplayCard>
            )}
            <InformationDisplayCard
              md={fullWidthCards ? 24 : 9}
              xs={24}
              sm={24}
              style={{ marginTop: 16 }}
              title={"Ownership Times"}
            >
              <br />
              {isMustOwnBadgesInput ? (
                timeString ?? "Transfer Time"
              ) : hideOwnershipTimeSelect ? (
                <>
                  <b>Select Ownership Times</b>
                  <br />
                  {getTimeRangesElement(currentSupply.ownershipTimes, "", true)}
                </>
              ) : (
                <>
                  <b>Select Ownership Times</b>
                  <div>
                    <Switch
                      checked={isFullUintRanges(currentSupply.ownershipTimes)}
                      checkedChildren="All Times"
                      unCheckedChildren="Custom"
                      onChange={(checked) => {
                        if (checked) {
                          setCurrentSupply({
                            ...currentSupply,
                            ownershipTimes: [
                              { start: 1n, end: GO_MAX_UINT_64 },
                            ],
                          })
                        } else {
                          setCurrentSupply({
                            ...currentSupply,
                            ownershipTimes: [],
                          })
                        }
                      }}
                    />
                    <br />
                    <br />
                    <div className="secondary-text">
                      <InfoCircleOutlined />{" "}
                      {isFullUintRanges(currentSupply.ownershipTimes) &&
                        (message == "Circulating Supplys"
                          ? "Badges are ownable (circulating) at all times."
                          : "Ownership of the selected badges is to be transferred for all times.")}
                      {!isFullUintRanges(currentSupply.ownershipTimes) &&
                        (message == "Circulating Supplys"
                          ? "Badges are ownable (circulating) only at custom times."
                          : "Ownership of the selected badges is to be transferred only for custom times.")}
                    </div>
                    <br />
                    <>
                      {isFullUintRanges(currentSupply.ownershipTimes) ? (
                        <></>
                      ) : (
                        <>
                          <DateRangeInput
                            timeRanges={currentSupply.ownershipTimes}
                            setTimeRanges={(timeRanges) => {
                              setCurrentSupply({
                                ...currentSupply,
                                ownershipTimes: timeRanges,
                              })
                            }}
                            suggestedTimeRanges={[
                              ...(suggestedBalances ?? []),
                              ...(defaultBalancesToShow ?? []),
                            ]
                              ?.map((x) => x.ownershipTimes)
                              .flat()}
                          />
                        </>
                      )}
                    </>
                  </div>
                </>
              )}
            </InformationDisplayCard>
          </Row>

          {!isDisabled && !isMustOwnBadgesInput && (
            <Row
              className="flex-center full-width"
              style={{ marginTop: 24, alignItems: "normal" }}
            >
              {!isDisabled &&
                !isMustOwnBadgesInput &&
                setIncrementBadgeIdsBy && (
                  <InformationDisplayCard
                    md={fullWidthCards ? 24 : 12}
                    xs={24}
                    sm={24}

                    title={"Increment"}
                  >
                    <SwitchForm
                      options={[
                        {
                          title: "No Increment",
                          message: `Each recipient (${numRecipients.toString()}) will receive x${currentSupply.amount.toString()} of the selected badges ${getBadgeIdsString(
                            currentSupply.badgeIds
                          )}.`,
                          isSelected: !incrementBadgeIdsBy,
                        },
                        {
                          title: "Increment Badge IDs",
                          message: `Increment badge IDs by a certain amount for each recipient. 
                    The first recipient will receive x${currentSupply.amount.toString()} of the selected badges: ID(s) ${getBadgeIdsString(
                            currentSupply.badgeIds
                          )}. 
                    The next recipient will receive x${currentSupply.amount.toString()} of the selected badges, but they are incremeted by x${incrementBadgeIdsBy}: ID(s) ${getBadgeIdsString(
                            currentSupply.badgeIds.map((x) => {
                              return {
                                start: x.start + incrementBadgeIdsBy,
                                end: x.end + incrementBadgeIdsBy,
                              }
                            })
                          )}, and so on.`,
                          isSelected: !!incrementBadgeIdsBy,
                          additionalNode: () => (
                            <NumberInput
                              value={Number(incrementBadgeIdsBy)}
                              setValue={(value) => {
                                setIncrementBadgeIdsBy?.(BigInt(value))
                              }}
                              title="Increment Amount"
                              min={1}
                              max={Number.MAX_SAFE_INTEGER}
                            />
                          ),
                          disabled: !setIncrementBadgeIdsBy,
                        },
                      ]}
                      onSwitchChange={(idx) => {
                        setIncrementBadgeIdsBy?.(idx === 0 ? 0n : 1n)
                      }}
                    />
                  </InformationDisplayCard>
                )}
              <InformationDisplayCard
                md={fullWidthCards ? 24 : setIncrementBadgeIdsBy ? 12 : 24}
                xs={24}
                sm={24}

                title={""}
              >
                <BalanceDisplay
                  collectionId={collectionId}
                  balances={!isDisabled ? deepCopy([currentSupply]) : []}
                  message={"Badges to Add"}
                  hideOwnershipTimeSelect={hideOwnershipTimeSelect}
                  isMustOwnBadgesInput={isMustOwnBadgesInput}
                  editable={false}
                  incrementBadgeIdsBy={incrementBadgeIdsBy}
                  numIncrements={numRecipients}
                />
              </InformationDisplayCard>
            </Row>
          )}
          <br />
          <div
            style={{
              textAlign: "center",
              verticalAlign: "top",
              paddingRight: 4,
            }}
            className="full-width"
          >
            <button
              className="landing-button full-width"
              style={{ width: "100%" }}
              disabled={isDisabled}
              onClick={() => {
                onAddBadges?.(
                  deepCopy(currentSupply),
                  //rest are ignored unless mustOwnBadges input
                  selectedAmountRange,
                  selectedCollectionId,
                  mustOwnAll
                )

                setCurrentSupply({
                  amount: 1n,
                  badgeIds: [],
                  ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }],
                })

                setSelectIsVisible(false)
              }}
            >
              Add Badges
            </button>
            <span style={{ color: "red" }}>
              {isDisabled && nonSequential
                ? "Badge IDs must be sequential starting from 1 (no gaps)."
                : isDisabled
                  ? "All options must be non-empty and have no errors."
                  : ""}
            </span>
          </div>
        </>
      )}
    </>
  )
}
