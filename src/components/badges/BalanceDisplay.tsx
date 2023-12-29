import { InfoCircleOutlined } from "@ant-design/icons"
import { Col, Empty, Tooltip } from "antd"
import {
  Balance,
  BigIntify,
  MustOwnBadges,
  UintRange,
  convertUintRange,
} from "bitbadgesjs-proto"
import { ReactNode, useMemo, useState } from "react"
import { getBadgeIdsString } from "../../utils/badgeIds"
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates"
import { Pagination } from "../common/Pagination"
import { BalanceDisplayEditRow } from "../inputs/BalanceDisplayEditRow"
import { getAllBadgeIdsToBeTransferred } from "../transfers/ApprovalSelect"
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay"

export function BalanceDisplay({
  collectionId,
  balances,
  message,
  size,
  showingSupplyPreview,
  numIncrements = 0n,
  incrementBadgeIdsBy = 0n,
  incrementOwnershipTimesBy = 0n,
  hideOwnershipTimeSelect,
  mustOwnBadges,

  cardView,
  hideMessage,
  hideBadges,
  hideTable,
  floatToRight,
  isMustOwnBadgesInput,
  editable,
  onAddBadges,
  minimum,
  maximum,
  onRemoveAll,
  sequentialOnly,
  fullWidthCards,
  setIncrementBadgeIdsBy,
  doNotCalculate,
  timeString,
  suggestedBalances,
}: {
  mustOwnBadges?: MustOwnBadges<bigint>[]
  collectionId: bigint
  balances: Balance<bigint>[]
  numIncrements?: bigint
  incrementBadgeIdsBy?: bigint
  incrementOwnershipTimesBy?: bigint
  hideOwnershipTimeSelect?: boolean
  message?: string | ReactNode
  size?: number
  showingSupplyPreview?: boolean

  cardView?: boolean
  hideMessage?: boolean
  hideBadges?: boolean
  hideTable?: boolean
  floatToRight?: boolean
  isMustOwnBadgesInput?: boolean
  editable?: boolean
  onAddBadges?: (
    balance: Balance<bigint>,
    amountRange?: UintRange<bigint>,
    collectionId?: bigint
  ) => void
  minimum?: bigint
  maximum?: bigint
  setBalances?: (balances: Balance<bigint>[]) => void
  onRemoveAll?: () => void
  sequentialOnly?: boolean
  fullWidthCards?: boolean
  setIncrementBadgeIdsBy?: (incrementBadgeIdsBy: bigint) => void
  doNotCalculate?: boolean
  timeString?: string
  suggestedBalances?: Balance<bigint>[]
}) {
  const [defaultBalancesToShow] = useState<Balance<bigint>[]>(balances)

  const [incrementNum, setIncrementNum] = useState<number>(0)

  const allBalances = useMemo(() => {
    let balancesToReturn = balances
    if (numIncrements > 1n) {
      balancesToReturn = balances.map((x) => {
        return {
          ...x,
          badgeIds: x.badgeIds.map((y) => {
            return {
              start: y.start + incrementBadgeIdsBy * BigInt(incrementNum),
              end: y.end + incrementBadgeIdsBy * BigInt(incrementNum),
            }
          }),
          ownershipTimes: x.ownershipTimes.map((y) => {
            return {
              start: y.start + incrementOwnershipTimesBy * BigInt(incrementNum),
              end: y.end + incrementOwnershipTimesBy * BigInt(incrementNum),
            }
          }),
        }
      })
    }

    return doNotCalculate
      ? balancesToReturn
      : !isMustOwnBadgesInput
        ? balancesToReturn
        : balancesToReturn.map((x) => {
          return { ...x, ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }] }
        })
  }, [
    balances,
    doNotCalculate,
    isMustOwnBadgesInput,
    incrementNum,
    incrementBadgeIdsBy,
    incrementOwnershipTimesBy,
    numIncrements,
  ])

  const allBadgeIdsArr: UintRange<bigint>[] = useMemo(() => {
    if (numIncrements > 1n) {
      return getAllBadgeIdsToBeTransferred([
        {
          from: "",
          balances: balances,
          toAddresses: [],
          toAddressesLength: numIncrements > 0 ? numIncrements : 1n,
          incrementBadgeIdsBy: incrementBadgeIdsBy,
          incrementOwnershipTimesBy: incrementOwnershipTimesBy,
        },
      ])
    }

    return (
      allBalances?.map((balanceAmount) => {
          return balanceAmount.badgeIds.map((uintRange) =>
            convertUintRange(uintRange, BigIntify)
          )
        })
        .flat() ?? []
    )
  }, [
    allBalances,
    numIncrements,
    incrementBadgeIdsBy,
    incrementOwnershipTimesBy,
    balances,
  ])

  const EditRowComponent = (
    <BalanceDisplayEditRow
      collectionId={collectionId}
      balances={balances}
      isMustOwnBadgesInput={isMustOwnBadgesInput}
      onAddBadges={onAddBadges}
      minimum={minimum}
      maximum={maximum}
      hideOwnershipTimeSelect={hideOwnershipTimeSelect}
      message={message}
      defaultBalancesToShow={defaultBalancesToShow}
      onRemoveAll={onRemoveAll}
      sequentialOnly={sequentialOnly}
      fullWidthCards={fullWidthCards}
      incrementBadgeIdsBy={incrementBadgeIdsBy}
      setIncrementBadgeIdsBy={setIncrementBadgeIdsBy}
      numRecipients={numIncrements}
      timeString={timeString}
      suggestedBalances={suggestedBalances}
    />
  )

  let castedMustOwnBadges = mustOwnBadges
    ? mustOwnBadges
    : allBalances.map((x) => {
      return {
        ...x,
        amountRange: { start: x.amount, end: GO_MAX_UINT_64 },
        collectionId: 0n,
      }
    })

  return (
    <div className="flex-center flex-column full-width">
      {!hideMessage && (
        <div className="flex-evenly">
          <div
            className="full-width flex-center"
            style={{ textAlign: "center", fontSize: 20 }}
          >
            <b>{message ? message : "Balances"}</b>
          </div>
        </div>
      )}
      <div className="flex-center full-width">
        <div
          className="flex-column full-width"
          style={{
            textAlign: floatToRight ? "right" : "center",
            justifyContent: "end",
          }}
        >
          <Col md={24} xs={24} sm={24}>
            {numIncrements > 1n &&
              allBalances.length > 0 &&
              allBadgeIdsArr.length > 0 &&
              !hideTable && (
                <div
                  className="flex-center flex-column full-width"
                  style={{ textAlign: "center" }}
                >
                  <Pagination
                    currPage={incrementNum + 1}
                    onChange={(page) => {
                      setIncrementNum(page - 1)
                    }}
                    total={Number(numIncrements)}
                    pageSize={1}
                  />
                </div>
              )}
            <div
              className="flex-center flex-column full-width"
              style={{ textAlign: "center" }}
            >
              {!hideTable && (
                <table className="table-auto" style={{ alignItems: "normal" }}>
                  {
                    <thead>
                      <tr>
                        {isMustOwnBadgesInput && (
                          <th
                            style={{
                              textAlign: "center",
                              verticalAlign: "top",
                              fontWeight: "bold",
                              paddingRight: 4,
                            }}
                          >
                            Collection ID
                          </th>
                        )}
                        <th
                          style={{
                            textAlign: "center",
                            verticalAlign: "top",
                            fontWeight: "bold",
                            paddingRight: 4,
                            minWidth: 70,
                          }}
                        >
                          {"Amount"}
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            verticalAlign: "top",
                            fontWeight: "bold",
                            paddingLeft: 4,
                          }}
                        >
                          IDs
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            verticalAlign: "top",
                            fontWeight: "bold",
                            paddingLeft: 4,
                          }}
                        >
                          Times
                          <Tooltip
                            color="black"
                            title={
                              "During this timeframe, the badge are " +
                              (showingSupplyPreview
                                ? "in circulation."
                                : "owned by this address.")
                            }
                          >
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                        </th>
                      </tr>
                    </thead>
                  }
                  <tbody>
                    {castedMustOwnBadges.map((balance, idx) => {
                      const amount = balance.amountRange.start
                      const amountRange = balance.amountRange
                      const collectionId = balance.collectionId
                      const badgeIds = balance.badgeIds
                      const ownershipTimes = balance.ownershipTimes

                      const NormalRowComponent = (
                        <tr
                          key={idx}
                          style={{ color: amount < 0 ? "red" : undefined }}
                        >
                          {isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: "center",
                                verticalAlign: "top",
                                paddingRight: 4,
                              }}
                            >
                              {collectionId.toString()}
                            </td>
                          )}
                          {!isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: "center",
                                verticalAlign: "top",
                                paddingRight: 4,
                              }}
                            >
                              x{amount.toString()}
                            </td>
                          )}
                          {isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: "center",
                                verticalAlign: "top",
                                paddingRight: 4,
                              }}
                            >
                              {amountRange.start.toString()} (Min) -{" "}
                              {amountRange.end.toString()} (Max)
                            </td>
                          )}
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "top",
                              paddingLeft: 4,
                            }}
                          >
                            {" "}
                            {getBadgeIdsString(badgeIds)}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "top",
                              paddingLeft: 4,
                            }}
                          >
                            {isMustOwnBadgesInput
                              ? timeString ?? "Transfer Time"
                              : getTimeRangesElement(ownershipTimes, "", true)}
                          </td>
                        </tr>
                      )

                      return <>{NormalRowComponent}</>

                      // let displayStr = '';
                      // if (!isMustOwnBadgesInput) displayStr += 'x' + amount.toString() + ' - ';
                      // if (isMustOwnBadgesInput) displayStr += 'x' + amountRange.start.toString() + ' (Min) - x' + amountRange.end.toString() + ' (Max) - ';
                      // if (isMustOwnBadgesInput) displayStr += 'Collection ID ' + collectionId.toString() + ' - ';
                      // displayStr += 'IDs ' + getBadgeIdsString(badgeIds) + ' - ';

                      // return <>
                      //   {displayStr}{isMustOwnBadgesInput ? (timeString ?? 'Transfer Time') : getTimeRangesElement(ownershipTimes, '', true)}
                      // </>
                    })}
                  </tbody>
                  {castedMustOwnBadges?.length === 0 && (
                    <>
                      <td colSpan={1000}>None</td>
                    </>
                  )}
                </table>
              )}
              {!hideBadges && !isMustOwnBadgesInput && (
                <>
                  <div className="full-width flex-center">
                    {!balances || balances?.length === 0 ? (
                      <div
                        className="full-width flex-center"
                        style={{ textAlign: "center", display: "flex" }}
                      >
                        <Empty
                          className="primary-text inherit-bg"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={"No balances found."}
                        />
                      </div>
                    ) : (
                      <div style={{ marginTop: 4 }} className=" full-width">
                        <br />
                        <BadgeAvatarDisplay
                          collectionId={collectionId}
                          balance={allBalances}
                          badgeIds={
                            numIncrements > 1n
                              ? castedMustOwnBadges
                                .map((x) => x.badgeIds)
                                .flat()
                              : allBadgeIdsArr
                          }
                          showIds
                          showSupplys={numIncrements > 1n ? false : true}
                          cardView={cardView}
                          size={size ? size : 45}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              {editable && (
                <>
                  <br />
                  <div
                    className="flex-center flex-column full-width"
                    style={{ textAlign: "center" }}
                  >
                    {EditRowComponent}
                  </div>
                </>
              )}
            </div>
          </Col>
        </div>
      </div>
    </div>
  )
}
