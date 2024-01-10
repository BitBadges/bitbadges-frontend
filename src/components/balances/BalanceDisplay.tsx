import { InfoCircleOutlined } from "@ant-design/icons"
import { Col, Empty, Tooltip } from "antd"
import { Balance, BigIntify, MustOwnBadges, UintRange, convertUintRange, deepCopy } from "bitbadgesjs-proto"
import { ReactNode, useMemo, useState } from "react"
import { getBadgeIdsString } from "../../utils/badgeIds"
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates"
import { Pagination } from "../common/Pagination"
import { BalanceDisplayEditRow } from "./BalanceDisplayEditRow"
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay"
import { applyIncrementsToBalances } from "bitbadgesjs-utils"
import { getAllBadgeIdsToBeTransferred } from "bitbadgesjs-utils"



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
  noOffChainBalances,
  cardView,
  hideMessage,
  hideBadges,
  hideTable,
  floatToRight,
  isMustOwnBadgesInput,
  editable,
  onAddBadges,
  onRemoveAll,
  sequentialOnly,
  setIncrementBadgeIdsBy,
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
  noOffChainBalances?: boolean
  onAddBadges?: (
    balance: Balance<bigint>,
    amountRange?: UintRange<bigint>,
    collectionId?: bigint,
    mustOwnAll?: boolean
  ) => void
  setBalances?: (balances: Balance<bigint>[]) => void
  onRemoveAll?: () => void
  sequentialOnly?: boolean
  fullWidthCards?: boolean
  setIncrementBadgeIdsBy?: (incrementBadgeIdsBy: bigint) => void
  timeString?: string
  suggestedBalances?: Balance<bigint>[]
}) {
  const [defaultBalancesToShow] = useState<Balance<bigint>[]>(balances)

  const [incrementNum, setIncrementNum] = useState<number>(0)

  const currBalancesToDisplay = useMemo(() => {
    let balancesToReturn = applyIncrementsToBalances(deepCopy(balances), incrementBadgeIdsBy, incrementOwnershipTimesBy, BigInt(incrementNum))

    return !isMustOwnBadgesInput
      ? balancesToReturn
      : balancesToReturn.map((x) => {
        return { ...x, ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }] }
      })
  }, [
    balances,
    isMustOwnBadgesInput,
    incrementNum,
    incrementBadgeIdsBy,
    incrementOwnershipTimesBy,
  ])

  const allBadgeIdsArr: UintRange<bigint>[] = useMemo(() => {
    if (numIncrements > 1n) {
      return getAllBadgeIdsToBeTransferred([
        {
          from: "",
          balances: deepCopy(balances),
          toAddresses: [],
          toAddressesLength: numIncrements > 0 ? numIncrements : 1n,
          incrementBadgeIdsBy: incrementBadgeIdsBy,
          incrementOwnershipTimesBy: incrementOwnershipTimesBy,
        },
      ])
    }

    return (
      currBalancesToDisplay?.map((balanceAmount) => {
        return balanceAmount.badgeIds.map((uintRange) =>
          convertUintRange(uintRange, BigIntify)
        )
      })
        .flat() ?? []
    )
  }, [
    currBalancesToDisplay,
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
      noOffChainBalances={noOffChainBalances}
      onAddBadges={onAddBadges}
      hideOwnershipTimeSelect={hideOwnershipTimeSelect}
      message={message}
      defaultBalancesToShow={defaultBalancesToShow}
      onRemoveAll={onRemoveAll}
      sequentialOnly={sequentialOnly}
      incrementBadgeIdsBy={incrementBadgeIdsBy}
      setIncrementBadgeIdsBy={setIncrementBadgeIdsBy}
      numRecipients={numIncrements}
      timeString={timeString}
      suggestedBalances={suggestedBalances}
    />
  )

  let castedMustOwnBadges = mustOwnBadges
    ? mustOwnBadges
    : currBalancesToDisplay.map((x) => {
      return {
        ...x,
        amountRange: { start: x.amount, end: GO_MAX_UINT_64 },
        collectionId: 0n,
        mustOwnAll: true,
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
      <div className="flex-center full-width" style={{}}>
        <div className="flex-column full-width" style={{
          textAlign: floatToRight ? "right" : "center",
          justifyContent: "end",
        }}
        >
          <Col md={24} xs={24} sm={24}>
            {numIncrements > 1n &&
              currBalancesToDisplay.length > 0 &&
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
                        {isMustOwnBadgesInput && (
                          <th
                            style={{
                              textAlign: "center",
                              verticalAlign: "top",
                              fontWeight: "bold",
                              paddingRight: 4,
                            }}
                          >
                            Reqs.
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
                          {isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: "center",
                                verticalAlign: "top",
                                paddingRight: 4,
                              }}
                            >
                              {balance.mustOwnAll ? "Must Own All" : "Must Own One"}
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
                              x{amountRange.start.toString()} (Min) -{" "}
                              x{amountRange.end.toString()} (Max)
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
                          balance={currBalancesToDisplay}
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
                          size={size ? size : 60}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              {isMustOwnBadgesInput && (
                <>
                  {mustOwnBadges?.map((x, idx) => {
                    return (
                      <div
                        key={idx}
                        className="full-width flex-center"
                        style={{ textAlign: "center", display: "flex" }}
                      >
                        <div style={{ marginTop: 4 }} className=" full-width">
                          <br />
                          <BadgeAvatarDisplay
                            collectionId={x.collectionId}
                            badgeIds={x.badgeIds}
                            showIds
                            showSupplys={false}
                            cardView={cardView}
                            size={size ? size : 60}
                          />
                        </div>
                      </div>
                    )
                  })}
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
