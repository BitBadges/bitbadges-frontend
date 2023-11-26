import { Modal, Spin, Tooltip, Typography } from "antd";
import { Balance, UintRange, deepCopy } from "bitbadgesjs-proto";
import { BalanceInfo, BitBadgesUserInfo, getBadgesToDisplay, getBalancesForId, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";


import { getAccountBalancesView, useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { batchFetchAndUpdateMetadata, useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressDisplay } from "../address/AddressDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";
import { BadgeCard } from "./BadgeCard";
import { CustomizeButtons } from "./MultiCollectionCustomizeButtons";

export const filterBadgeIdsFromBalanceInfos = (balances: BalanceInfo<bigint>[], badgeIdsToRemove: UintRange<bigint>[], removeSpecifiedBadges = true) => {
  for (const x of balances) {
    x.balances = filterBadgeIdsFromBalances(x.balances, badgeIdsToRemove, removeSpecifiedBadges);
  }

  return balances.filter(x => x.balances.length > 0);
}

export const filterBadgeIdsFromBalances = (balances: Balance<bigint>[], badgeIdsToRemove: UintRange<bigint>[], removeSpecifiedBadges = true) => {
  const newBalances = deepCopy(balances);
  for (const balance of newBalances) {
    const [remaining, removed] = removeUintRangeFromUintRange(badgeIdsToRemove, balance.badgeIds);
    if (removeSpecifiedBadges) {
      balance.badgeIds = remaining;
    } else {
      balance.badgeIds = removed;
    }
  }
  return newBalances.filter(x => x.badgeIds.length > 0);
}

export function CollectionDisplayWithBadges({
  badgeObj,
  accountInfo,
  hideAddress = true,
  cardView,
  showCustomizeButtons,
  addressOrUsernameToShowBalance,
  hideCollectionLink

}: {
  badgeObj: { collectionId: bigint, badgeIds: UintRange<bigint>[] }
  accountInfo?: BitBadgesUserInfo<bigint>
  hideAddress?: boolean
  cardView?: boolean
  showCustomizeButtons?: boolean
  addressOrUsernameToShowBalance?: string
  hideCollectionLink?: boolean
}) {

  const router = useRouter();
  const collectionId = badgeObj.collectionId;
  const collection = useCollection(collectionId);
  const account = useAccount(addressOrUsernameToShowBalance);

  const balances = accountInfo ? account?.collected.find(collected => collected.collectionId == collectionId)?.balances ?? []
    : collection?.owners.find(x => x.cosmosAddress == 'Total')?.balances ?? [];





  return <InformationDisplayCard noBorder inheritBg title='' style={{ margin: 8, alignItems: 'normal' }} >
    <Tooltip color='black' title={"Collection ID: " + collectionId} placement="bottom">
      <div className='link-button-nav flex-center' onClick={() => {
        router.push('/collections/' + collectionId)
        Modal.destroyAll()
      }} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <BadgeAvatar
          size={50}
          collectionId={collectionId}
          noHover
        />
        <Typography.Text className="primary-text" style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 10 }}>
          {collection?.cachedCollectionMetadata?.name}
        </Typography.Text>

      </div>
      {collection && !hideAddress &&
        <div className="flex-center">
          <Typography.Text className="primary-text" style={{ fontWeight: 'bold', marginRight: 10 }}>
            By:
          </Typography.Text>
          <AddressDisplay addressOrUsername={collection.createdBy} fontSize={14} />
          <br />
        </div>}

    </Tooltip>

    <BadgeAvatarDisplay
      collectionId={collectionId}
      cardView={cardView}
      balance={addressOrUsernameToShowBalance ? balances : undefined}
      badgeIds={badgeObj.badgeIds}
      hideCollectionLink={hideCollectionLink}
      showIds
      showSupplys
      showOnSinglePage
      fromMultiCollectionDisplay
    />
    <CustomizeButtons
      badgeIdObj={{ collectionId, badgeIds: balances.map((x) => x.badgeIds).flat() }}
      badgeId={1n}
      onlyShowCollectionOptions
      showCustomizeButtons={showCustomizeButtons}
      accountInfo={accountInfo}
    />
  </InformationDisplayCard>
}

export function MultiCollectionBadgeDisplay({
  collectionIds,
  addressOrUsernameToShowBalance,
  cardView,
  defaultPageSize = 10,
  customPageBadges,
  groupByCollection,
  hideCollectionLink,
  showCustomizeButtons,
  hideAddress
}: {
  collectionIds: bigint[],
  addressOrUsernameToShowBalance?: string,
  cardView?: boolean,
  defaultPageSize?: number,

  groupByCollection?: boolean;
  hideCollectionLink?: boolean;
  hidePagination?: boolean;
  hideAddress?: boolean;
  showCustomizeButtons?: boolean
  customPageBadges?: { collectionId: bigint, badgeIds: UintRange<bigint>[] }[]
}) {

  const accountInfo = useAccount(addressOrUsernameToShowBalance);

  const currPage = 1;
  const [loaded, setLoaded] = useState<boolean>(false); //Total number of badges in badgeIds[]

  const badgesToShow = getAccountBalancesView(accountInfo, showCustomizeButtons ? 'badgesCollectedWithHidden' : 'badgesCollected') as BalanceInfo<bigint>[];

  const allBadgeIds = useMemo(() => {
    //If we are using this as a collection display (i.e. we want to display all badges in the collection)
    //We need to fetch the collection first
    const allBadgeIds: {
      collectionId: bigint,
      badgeIds: UintRange<bigint>[]
    }[] = [];

    //If we have an account to show balances for, show that accounts balances
    //Or if we have custom pages to show, show those.
    //Else, show entire collection
    if (customPageBadges) {
      for (const obj of customPageBadges) {
        allBadgeIds.push({
          badgeIds: sortUintRangesAndMergeIfNecessary(deepCopy(obj.badgeIds), true),
          collectionId: obj.collectionId
        });
      }
    } else if (accountInfo) {
      for (const collectionId of collectionIds) {
        let balances = deepCopy(badgesToShow.flat() ?? []);
        

        if (balances) {
          const balanceInfo = balances.find(balance => balance.collectionId == collectionId);
          for (const balance of balanceInfo?.balances || []) {
            allBadgeIds.push({
              badgeIds: balance.badgeIds.filter((badgeId, idx) => {
                return balance.badgeIds.findIndex(badgeId2 => badgeId2.start == badgeId.start && badgeId2.end == badgeId.end) == idx;
              }),
              collectionId
            });
          }
        }
      }
    } else {

      for (const collectionId of collectionIds) {
        if (groupByCollection) {

          //We have not fetched supply yet. We jsut push this so it triggers the metadata update
          allBadgeIds.push({
            badgeIds: [{ start: 1n, end: BigInt(defaultPageSize) }],
            collectionId
          });
        }
      }
    }

    return allBadgeIds;
  }, [accountInfo, badgesToShow, collectionIds, customPageBadges, groupByCollection, defaultPageSize]);

  const badgeIdsToDisplay = useMemo(() => {
    if (!groupByCollection) {
      return getBadgesToDisplay(allBadgeIds, currPage, defaultPageSize);
    } else {
      return allBadgeIds;
    }
  }, [allBadgeIds, groupByCollection, defaultPageSize, currPage]);

  useEffect(() => {
    async function fetchAndUpdate() {
      //Calculate total number of badge IDs  to display

      if (!groupByCollection) {

        //Calculate badge IDs to display and update metadata for badge IDs if absent
        if (badgeIdsToDisplay.length > 0) {
          await batchFetchAndUpdateMetadata(badgeIdsToDisplay.map(x => {
            return {
              collectionId: x.collectionId,
              metadataToFetch: {
                badgeIds: x.badgeIds
              },
            }
          }));
        }

        setLoaded(true);
      } else {
        //We fetch the initial badges for each collection in a single batch request 
        //and use loaded to not trigger the inital fetch in BadgeAvatarDisplay
        //Any subsequent fetches will be done in BadgeAvatarDisplay

        await batchFetchAndUpdateMetadata(allBadgeIds.map(x => {
          return {
            collectionId: x.collectionId,
            metadataToFetch: {
              badgeIds: [{ start: 1n, end: BigInt(defaultPageSize) }]
            },
          }
        }));

        setLoaded(true);
      }
    }

    if (INFINITE_LOOP_MODE) console.log("MultiCollectionBadgeDisplay: useEffect: badgeIdsToDisplay: ", badgeIdsToDisplay, allBadgeIds);
    fetchAndUpdate();
    //Note still depends on a context (accountInfo / accountsContext).
  }, [collectionIds, badgeIdsToDisplay, groupByCollection, allBadgeIds, defaultPageSize]);

  if (groupByCollection) {
    ///Little hacky way to not trigger the first fetch in BadgeAvatarDisplay in favor of the batch fetch from this file
    if (!loaded) return <Spin />

    return <>
      <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
        {
          allBadgeIds.map((badgeObj, idx) => {
            return <CollectionDisplayWithBadges
              badgeObj={badgeObj}
              accountInfo={accountInfo}
              hideAddress={hideAddress}
              cardView={cardView}
              showCustomizeButtons={showCustomizeButtons}
              addressOrUsernameToShowBalance={addressOrUsernameToShowBalance}
              hideCollectionLink={hideCollectionLink}
              key={idx}
            />
          })
        }
      </div>
    </>


  } else {

    return <>
      <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>

        {
          badgeIdsToDisplay.map((badgeIdObj) => {
            return <>
              {badgeIdObj.badgeIds.map((badgeUintRange, idx) => {
                const badgeIds: bigint[] = [];
                for (let i = badgeUintRange.start; i <= badgeUintRange.end; i++) {
                  badgeIds.push(i);
                }
                return <>
                  {badgeIds.map((badgeId) => {
                    return <>
                      {cardView ? <>
                        <div className="" style={{ alignItems: 'normal' }}>
                          <BadgeCard
                            collectionId={badgeIdObj.collectionId}
                            badgeId={badgeId}
                            hideCollectionLink={hideCollectionLink}
                            key={idx}
                            showSupplys={!!addressOrUsernameToShowBalance}
                            balances={
                              getBalancesForId(badgeId, (badgesToShow.find(collected => collected.collectionId == badgeIdObj.collectionId)?.balances) ?? [])
                            }
                          />
                          <CustomizeButtons
                            badgeIdObj={badgeIdObj}
                            badgeId={badgeId}
                            showCustomizeButtons={showCustomizeButtons}
                            accountInfo={accountInfo}
                          />
                        </div>
                      </>
                        :
                        <BadgeAvatar
                          size={70}
                          key={idx}
                          collectionId={badgeIdObj.collectionId}
                          badgeId={badgeId}
                          // showId={!!addressOrUsernameToShowBalance}
                          showSupplys={!!addressOrUsernameToShowBalance}
                          balances={
                            getBalancesForId(badgeId, (badgesToShow.find(collected => collected.collectionId == badgeIdObj.collectionId)?.balances) ?? [])
                          }
                        />
                      }
                    </>
                  })}
                </>
              })}
            </>
          })
        }
      </div>
    </>
  }
}