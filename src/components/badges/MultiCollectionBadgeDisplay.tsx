import { Spin, Tooltip, Typography } from "antd"
import { deepCopy } from "bitbadgesjs-proto"
import {
  BalanceDoc,
  BitBadgesUserInfo,
  getBadgesToDisplay,
  getBalancesForId,
  removeUintRangesFromUintRanges
} from "bitbadgesjs-utils"
import { useEffect, useMemo, useState } from "react"

import { BatchBadgeDetails, getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import { useTxTimelineContext } from "../../bitbadges-api/contexts/TxTimelineContext"
import {
  getAccountBalancesView,
  useAccount,
} from "../../bitbadges-api/contexts/accounts/AccountsContext"
import {
  batchFetchAndUpdateMetadata,
  fetchMetadataForPreview,
  useCollection,
} from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { INFINITE_LOOP_MODE } from "../../constants"
import { GO_MAX_UINT_64 } from "../../utils/dates"
import { AddressDisplay } from "../address/AddressDisplay"
import { InformationDisplayCard } from "../display/InformationDisplayCard"
import { BadgeAvatar } from "./BadgeAvatar"
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay"
import { BadgeCard } from "./BadgeCard"
import { CollectionHeader } from "./CollectionHeader"

export function CollectionDisplayWithBadges({
  badgeObj,
  accountInfo,
  hideAddress = true,
  cardView,
  addressOrUsernameToShowBalance,
  hideCollectionLink,
  span,
  sortBy,
  showCustomizeButtons,
  isWatchlist,
  browseDisplay
}: {
  badgeObj: BatchBadgeDetails<bigint>
  accountInfo?: BitBadgesUserInfo<bigint>
  hideAddress?: boolean
  cardView?: boolean
  addressOrUsernameToShowBalance?: string
  hideCollectionLink?: boolean
  span?: number
  sortBy?: "oldest" | "newest" | undefined,
  showCustomizeButtons?: boolean,
  isWatchlist?: boolean,
  browseDisplay?: boolean
}) {
  const collectionId = badgeObj.collectionId
  const collection = useCollection(collectionId)
  const account = useAccount(addressOrUsernameToShowBalance)

  const balances = accountInfo ? account?.collected.find((collected) => collected.collectionId == collectionId)?.balances ?? []
    : collection?.owners.find((x) => x.cosmosAddress == "Total")?.balances ?? []

  //In the parent display, if we haven't fetched the collection yet
  //and wnat to display all badges in the collection, we do 1-MAXUINT64 and
  //here, we filter out once we get the collection to only include in range badge IDs
  if (collection) {
    const [remaining] = removeUintRangesFromUintRanges([{ start: getMaxBadgeIdForCollection(collection) + 1n, end: GO_MAX_UINT_64 }], badgeObj.badgeIds);
    badgeObj = { ...badgeObj, badgeIds: remaining }
  }

  return (
    <InformationDisplayCard
      style={{ alignItems: "normal" }}
      md={span ?? 8}
      xs={span ?? 24}
      sm={span ?? 24}
      noBorder={!browseDisplay}
      inheritBg={!browseDisplay}
    >
      <Tooltip
        color="black"
        title={"Collection ID: " + collectionId}
        placement="bottom"
      >
        {browseDisplay && <CollectionHeader collectionId={collectionId} multiDisplay hideCollectionLink={hideCollectionLink} />}
        {collection && !hideAddress && (
          <div className="flex-center">
            <Typography.Text
              className="primary-text"
              style={{ fontWeight: "bold", marginRight: 10 }}
            >
              By:
            </Typography.Text>
            <AddressDisplay
              addressOrUsername={collection.createdBy}
              fontSize={14}
            />
            <br />
          </div>
        )}
      </Tooltip>

      <BadgeAvatarDisplay
        collectionId={collectionId}
        cardView={cardView}
        balance={addressOrUsernameToShowBalance ? balances : undefined}
        badgeIds={badgeObj.badgeIds}
        hideCollectionLink={false}
        showIds
        showSupplys
        showOnSinglePage
        fromMultiCollectionDisplay
        sortBy={sortBy}
        groupByCollection
        showCustomizeButtons={showCustomizeButtons}
        isWatchlist={isWatchlist}
        addressOrUsername={addressOrUsernameToShowBalance}
      />
    </InformationDisplayCard>
  )
}

export function MultiCollectionBadgeDisplay({
  collectionIds,
  addressOrUsernameToShowBalance,
  cardView,
  defaultPageSize = 10,
  customPageBadges,
  groupByCollection,
  browseDisplay,
  hideCollectionLink,
  showCustomizeButtons,
  hideAddress,
  isWatchlist,
  span,
  sortBy
}: {
  collectionIds: bigint[]
  addressOrUsernameToShowBalance?: string
  cardView?: boolean
  defaultPageSize?: number
  groupByCollection?: boolean
  hideCollectionLink?: boolean
  hidePagination?: boolean
  hideAddress?: boolean
  showCustomizeButtons?: boolean
  customPageBadges?: BatchBadgeDetails<bigint>[]
  isWatchlist?: boolean
  span?: number
  sortBy?: "oldest" | "newest" | undefined,
  browseDisplay?: boolean
}) {
  const accountInfo = useAccount(addressOrUsernameToShowBalance)
  const txTimelineContext = useTxTimelineContext()
  const currPage = 1
  const [loaded, setLoaded] = useState<boolean>(false)


  const badgesToShow = getAccountBalancesView(
    accountInfo,
    "badgesCollected"
  ) as BalanceDoc<bigint>[]

  const allBadgesToDisplay: BatchBadgeDetails<bigint>[] = useMemo(() => {
    //If we are using this as a collection display (i.e. we want to display all badges in the collection)
    //We need to fetch the collection first
    const allBadges: BatchBadgeDetails<bigint>[] = []

    //If we have an account to show balances for, show that accounts balances
    //Or if we have custom pages to show, show those.
    //Else, show entire collection
    if (customPageBadges) {
      allBadges.push(...deepCopy(customPageBadges))
    } else if (accountInfo) {
      for (const collectionId of collectionIds) {
        let balances = deepCopy(badgesToShow.flat() ?? [])

        if (balances) {
          const balanceInfo = balances.find(
            (balance) => balance.collectionId == collectionId && balance.balances.some(bal => bal.amount > 0n)
          )
          for (const balance of balanceInfo?.balances || []) {
            allBadges.push({
              badgeIds: balance.badgeIds.filter((badgeId, idx) => {
                return (
                  balance.badgeIds.findIndex((badgeId2) => badgeId2.start == badgeId.start && badgeId2.end == badgeId.end) == idx
                )
              }),
              collectionId,
            })
          }
        }
      }
    } else {
      for (const collectionId of collectionIds) {
        if (groupByCollection) {
          //We may have not fetched supply yet. We just push this so it triggers the metadata update
          //We filter out in the groupByCollection display (CollectionDisplayWithBadges)
          allBadges.push({
            badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
            collectionId,
          })
        }
      }
    }

    if (!groupByCollection) {
      return getBadgesToDisplay(deepCopy(allBadges), currPage, defaultPageSize, sortBy).filter((x) => x.badgeIds.length > 0)
    } else {
      return allBadges
    }
  }, [accountInfo, badgesToShow, collectionIds, customPageBadges, groupByCollection, defaultPageSize, currPage, sortBy])

  useEffect(() => {
    async function fetchAndUpdate() {
      //Calculate badge IDs to display and update metadata for badge IDs if absent
      if (allBadgesToDisplay.length > 0) {
        const allArePreviewFetches = allBadgesToDisplay.every((x) => x.collectionId == 0n)
        if (!allArePreviewFetches) {

          await batchFetchAndUpdateMetadata(
            allBadgesToDisplay.map((x) => {
              return {
                collectionId: x.collectionId,
                metadataToFetch: {
                  badgeIds: groupByCollection ? [{ start: 1n, end: BigInt(defaultPageSize) }] : x.badgeIds,
                },
              }
            })
          )
        } else {
          //Edge case where we are on the BadgesTab on an update TX timeline
          const existingCollectionId = txTimelineContext.existingCollectionId
          await fetchMetadataForPreview(
            existingCollectionId,
            allBadgesToDisplay.map((x) => x.badgeIds).flat(),
            true
          )
        }
      }

      setLoaded(true)
    }

    if (INFINITE_LOOP_MODE) console.log(
      "MultiCollectionBadgeDisplay: useEffect: badgeIdsToDisplay: ",
      allBadgesToDisplay
    )
    fetchAndUpdate()
  }, [collectionIds, groupByCollection, allBadgesToDisplay, defaultPageSize, txTimelineContext.existingCollectionId])

  if (groupByCollection) {
    ///Little hacky way to not trigger the first fetch in BadgeAvatarDisplay in favor of the batch fetch from this file
    if (!loaded) return <Spin />

    return (
      <>
        <div
          className="flex-center flex-wrap full-width"
          style={{ alignItems: "normal" }}
        >
          {allBadgesToDisplay.map((badgeObj, idx) => {
            return (
              <CollectionDisplayWithBadges
                badgeObj={badgeObj}
                accountInfo={accountInfo}
                hideAddress={hideAddress}
                cardView={cardView}
                addressOrUsernameToShowBalance={addressOrUsernameToShowBalance}
                hideCollectionLink={hideCollectionLink}
                key={idx}
                span={span}
                sortBy={sortBy}
                isWatchlist={isWatchlist}
                showCustomizeButtons={showCustomizeButtons}
                browseDisplay={browseDisplay}
              />
            )
          })}
        </div>
      </>
    )
  } else {
    return (
      <>
        <div
          className="flex-center flex-wrap full-width"
          style={{ alignItems: "normal" }}
        >
          {allBadgesToDisplay.map((badgeIdObj) => {
            return (
              <>
                {badgeIdObj.badgeIds.map((badgeUintRange, idx) => {
                  const badgeIds: bigint[] = []
                  for (let i = badgeUintRange.start; i <= badgeUintRange.end; i++) {
                    badgeIds.push(i)
                  }

                  //The getBadgesToDisplay returns the correct page according to newest
                  //However, start to end is still in increasing order which needs to be reversed
                  if (sortBy === 'newest') {
                    badgeIds.reverse();
                  }

                  return (
                    <>
                      {badgeIds.map((badgeId) => {
                        return (
                          <>
                            {cardView ? (
                              <div
                                className=""
                                style={{ alignItems: "normal" }}
                              >
                                <BadgeCard
                                  collectionId={badgeIdObj.collectionId}
                                  badgeId={badgeId}
                                  hideCollectionLink={hideCollectionLink}
                                  key={idx}
                                  showSupplys={
                                    !!addressOrUsernameToShowBalance
                                  }
                                  balances={getBalancesForId(
                                    badgeId,
                                    badgesToShow.find(
                                      (collected) =>
                                        collected.collectionId ==
                                        badgeIdObj.collectionId
                                    )?.balances ?? []
                                  )}
                                  showCustomizeButtons={showCustomizeButtons}
                                  isWatchlist={isWatchlist}
                                  addressOrUsername={
                                    addressOrUsernameToShowBalance
                                  }
                                />

                              </div>
                            ) : (
                              <BadgeAvatar
                                size={100}
                                key={idx}
                                collectionId={badgeIdObj.collectionId}
                                badgeId={badgeId}
                                showSupplys={!!addressOrUsernameToShowBalance}
                                balances={getBalancesForId(
                                  badgeId,
                                  badgesToShow.find(
                                    (collected) =>
                                      collected.collectionId ==
                                      badgeIdObj.collectionId
                                  )?.balances ?? []
                                )}
                              />
                            )}
                          </>
                        )
                      })}
                    </>
                  )
                })}
              </>
            )
          })}
        </div>
      </>
    )
  }
}
