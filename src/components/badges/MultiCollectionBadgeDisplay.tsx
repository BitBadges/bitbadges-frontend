import { Modal, Spin, Tooltip, Typography } from "antd";
import { Balance, UintRange, deepCopy } from "bitbadgesjs-proto";
import { BalanceInfo, Numberify, getBadgesToDisplay, getBalancesForId, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";

import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressDisplay } from "../address/AddressDisplay";
import { Pagination } from "../common/Pagination";
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

export function MultiCollectionBadgeDisplay({
  collectionIds,
  addressOrUsernameToShowBalance,
  cardView,
  defaultPageSize = 10,
  customPageBadges,
  groupByCollection,
  hideCollectionLink,
  hidePagination,
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
  const accountsContext = useAccountsContext();
  const collections = useCollectionsContext();
  const router = useRouter();
  const accountInfo = addressOrUsernameToShowBalance ? accountsContext.getAccount(addressOrUsernameToShowBalance) : undefined;

  const currPage = 1;
  const [loaded, setLoaded] = useState<boolean>(false); //Total number of badges in badgeIds[]
  const pageSize = defaultPageSize

  const badgesToShow = accountsContext.getBalancesView(accountInfo?.cosmosAddress ?? '', showCustomizeButtons ? 'badgesCollectedWithHidden' : 'badgesCollected') ?? []


  const allBadgeIds: {
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[] = [];


  //If we are using this as a collection display (i.e. we want to display all badges in the collection)
  //We need to fetch the collection first
  const unfetchedCollections = [];

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
      if (!showCustomizeButtons) {
        const onlyShowApproved = accountInfo.onlyShowApproved;
        const hiddenBadges = deepCopy(accountInfo.hiddenBadges ?? []);
        const shownBadges = deepCopy(accountInfo.shownBadges ?? []);
        if (onlyShowApproved) {
          balances = filterBadgeIdsFromBalanceInfos(balances, hiddenBadges.map(x => x.badgeIds).flat(), false);
        } else {
          balances = filterBadgeIdsFromBalanceInfos(balances, shownBadges.map(x => x.badgeIds).flat(), true);
        }
      }

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
      const collection = collections.getCollection(collectionId);
      if (groupByCollection && !collection) {
        unfetchedCollections.push(collectionId);

        //We don't have the whole supply yet. We jsut push this so it triggers the metadata update
        allBadgeIds.push({
          badgeIds: [{ start: 1n, end: BigInt(defaultPageSize) }],
          collectionId
        });
        continue;
      }

      const balances = collection?.owners?.find(x => x.cosmosAddress == 'Total')?.balances ?? [];
      if (balances) {
        for (const balance of balances || []) {
          allBadgeIds.push({
            badgeIds: balance.badgeIds.filter((badgeId, idx) => {
              return balance.badgeIds.findIndex(badgeId2 => badgeId2.start == badgeId.start && badgeId2.end == badgeId.end) == idx;
            }),
            collectionId
          });
        }
      }
    }
  }

  let total = 0;
  let badgeIdsToDisplay: {
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[] = [];

  if (!groupByCollection) {
    for (const obj of allBadgeIds) {
      for (const range of obj.badgeIds) {
        const numBadgesInRange = Numberify(range.end) - Numberify(range.start) + 1;
        total += numBadgesInRange;
      }
    }

    badgeIdsToDisplay = getBadgesToDisplay(allBadgeIds, currPage, defaultPageSize);
  } else {
    total = defaultPageSize
  }

  useEffect(() => {
    async function fetchAndUpdate() {
      //Calculate total number of badge IDs  to display

      if (!groupByCollection) {

        //Calculate badge IDs to display and update metadata for badge IDs if absent

        console.log('multi use effect', badgeIdsToDisplay);
        if (badgeIdsToDisplay.length > 0) {
          await collections.batchFetchAndUpdateMetadata(badgeIdsToDisplay.map(x => {
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
        //If we group by collection, we calculate according to the default view (10 badges per collection)
        //Note this is a hacky way to do this, but it works for now
        //We fetch the initial badges for each collection in a single batch request and use loaded to not trigger the inital fetch in BadgeAvatarDisplay
        //Any subsequent fetches will be done in BadgeAvatarDisplay

        console.log('multi use effect 3');
        await collections.batchFetchAndUpdateMetadata(allBadgeIds.map(x => {
          return {
            collectionId: x.collectionId,
            metadataToFetch: {
              badgeIds: [{ start: 1n, end: defaultPageSize }]
            },
          }
        }));


        //Note fetched collections may be incomplete. We are just using it for createBy fetches
        // await accountsContext.fetchAccounts(fetchedCollections.map(x => x.createdBy));

        setLoaded(true);
      }
    }

    if (INFINITE_LOOP_MODE) console.log("MultiCollectionBadgeDisplay: useEffect: badgeIdsToDisplay: ", badgeIdsToDisplay);
    fetchAndUpdate();
    //Note still depends on a context (accountInfo / accountsContext).
  }, [collectionIds, badgeIdsToDisplay, groupByCollection, allBadgeIds, defaultPageSize]);

  if (groupByCollection) {
    return <>
      <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
        {
          collectionIds.map((collectionId, idx) => {
            const collection = collections.getCollection(collectionId);

            const balances = accountInfo ? badgesToShow.find(collected => collected.collectionId == collectionId)?.balances ?? []
              : collection?.owners.find(x => x.cosmosAddress == 'Total')?.balances ?? [];
            if (balances.length == 0) return <></>;

            ///Little hacky way to not trigger the first fetch in BadgeAvatarDisplay in favor of the batch fetch from this file
            if (!loaded) return <Spin />


            return <InformationDisplayCard noBorder inheritBg title='' key={idx} style={{ margin: 8, alignItems: 'normal' }} >
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
                  <Typography.Text className="dark:text-white" style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 10 }}>
                    {collection?.cachedCollectionMetadata?.name}
                  </Typography.Text>

                </div>
                {collection && !hideAddress &&
                  <div className="flex-center">
                    <Typography.Text className="dark:text-white" style={{ fontWeight: 'bold', marginRight: 10 }}>
                      By:
                    </Typography.Text>
                    <AddressDisplay addressOrUsername={collection.createdBy} fontSize={14} />
                    <br />
                  </div>}

              </Tooltip>

              <BadgeAvatarDisplay
                collectionId={collectionId}
                defaultPageSize={defaultPageSize}
                cardView={cardView}
                addressOrUsernameToShowBalance={addressOrUsernameToShowBalance}
                balance={addressOrUsernameToShowBalance ? balances : undefined}
                badgeIds={balances.map((x) => x.badgeIds).flat()}
                hideCollectionLink={hideCollectionLink}
                showIds
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
          })
        }
      </div>
    </>


  } else {

    return <>
      <div className="flex-center flex-wrap full-width">

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
                        <div>
                          <BadgeCard
                            collectionId={badgeIdObj.collectionId}
                            badgeId={badgeId}
                            hideCollectionLink={hideCollectionLink}
                            key={idx}
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