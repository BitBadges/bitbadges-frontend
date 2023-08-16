import { Modal, Tooltip, Typography } from "antd";
import { UintRange } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay, getBalancesForId, getCurrentValueIdxForTimeline } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";

import { INFINITE_LOOP_MODE } from "../../constants";
import { Pagination } from "../common/Pagination";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";
import { BadgeCard } from "./BadgeCard";
import { AddressDisplay } from "../address/AddressDisplay";

export function MultiCollectionBadgeDisplay({
  collectionIds,
  addressOrUsernameToShowBalance,
  cardView,
  pageSize = 25,

  groupByCollection,
  hideCollectionLink,
  hidePagination
}: {
  collectionIds: bigint[],
  addressOrUsernameToShowBalance?: string,
  cardView?: boolean,
  pageSize?: number,

  groupByCollection?: boolean;
  hideCollectionLink?: boolean;
  hidePagination?: boolean;
}) {
  const accountsContext = useAccountsContext();
  const collections = useCollectionsContext();
  const router = useRouter();
  const accountInfo = addressOrUsernameToShowBalance ? accountsContext.getAccount(addressOrUsernameToShowBalance) : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

  //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]); // Badge IDs to display of length pageSize

  useEffect(() => {
    // if (groupByCollection) {
    //   return;
    // }

    // //Is there a way we can not depend on accountsContext with no errors?
    // if (!accountInfo) return;

    //Calculate badge IDs for each collection
    const allBadgeIds: {
      collectionId: bigint,
      badgeIds: UintRange<bigint>[]
    }[] = [];
    if (accountInfo) {
      for (const collectionId of collectionIds) {
        const balances = accountInfo?.collected.flat() ?? [];
        if (balances) {
          const balanceInfo = balances.find(balance => balance.collectionId === collectionId);
          for (const balance of balanceInfo?.balances || []) {
            allBadgeIds.push({
              badgeIds: balance.badgeIds.filter((badgeId, idx) => {
                return balance.badgeIds.findIndex(badgeId2 => badgeId2.start === badgeId.start && badgeId2.end === badgeId.end) === idx;
              }),
              collectionId
            });
          }
        }
      }
    } else {
      for (const collectionId of collectionIds) {
        const balances = collections.collections[collectionId.toString()]?.owners?.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
        if (balances) {
          for (const balance of balances || []) {
            allBadgeIds.push({
              badgeIds: balance.badgeIds.filter((badgeId, idx) => {
                return balance.badgeIds.findIndex(badgeId2 => badgeId2.start === badgeId.start && badgeId2.end === badgeId.end) === idx;
              }),
              collectionId
            });
          }
        }
      }
    }

    //Calculate total number of badge IDs
    let total = 0;
    if (!groupByCollection) {
      for (const obj of allBadgeIds) {
        for (const range of obj.badgeIds) {
          const numBadgesInRange = Numberify(range.end) - Numberify(range.start) + 1;
          total += numBadgesInRange;
        }
      }
      setTotal(total);

      //Calculate badge IDs to display and update metadata for badge IDs if absent
      const badgeIdsToDisplay: {
        collectionId: bigint,
        badgeIds: UintRange<bigint>[]
      }[] = getBadgesToDisplay(allBadgeIds, currPage, pageSize);
      setBadgeIdsToDisplay(badgeIdsToDisplay);

      for (const badgeIdObj of badgeIdsToDisplay) {
        collections.fetchAndUpdateMetadata(badgeIdObj.collectionId, { badgeIds: badgeIdObj.badgeIds });
      }
    }

    if (INFINITE_LOOP_MODE) console.log("MultiCollectionBadgeDisplay: useEffect: badgeIdsToDisplay: ", badgeIdsToDisplay);

    //Note still depends on a context (accountInfo / accountsContext).
  }, [collectionIds, currPage, pageSize, accountInfo, groupByCollection]);

  if (groupByCollection) {
    return <>
      {!hidePagination && <Pagination currPage={currPage} total={total} pageSize={pageSize} onChange={setCurrPage} />}
      <br />

      <div className="flex-center flex-wrap" style={{ alignItems: 'normal' }}>
        {
          collectionIds.map((collectionId, idx) => {
            const collection = collections.collections[collectionId.toString()];
            const balances = accountInfo ? accountInfo?.collected.find(collected => collected.collectionId === collectionId)?.balances ?? []
              : collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
            if (balances.length === 0) return <></>;

            const currentManagerIdx = getCurrentValueIdxForTimeline(collection?.managerTimeline ?? []);
            const currentManager = currentManagerIdx >= 0 ? collection?.managerTimeline[Number(currentManagerIdx)].manager : undefined;

            return <div key={idx} style={{ width: 350, margin: 10, display: 'flex', }}>
              {/*
                //TODO: Sync with CollectionDisplay
              */}
              <InformationDisplayCard

                noBorder
                title={<>
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
                      {collection?.cachedCollectionMetadata?.name}
                    </div>

                  </Tooltip>
                  <div>
                    <Typography.Text style={{ fontSize: 14 }} strong className='primary-text'>{
                      currentManager ? "Managed By" : "Created By"
                    }</Typography.Text>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <AddressDisplay fontSize={14} addressOrUsername={currentManager ? currentManager : collection?.createdBy ?? ''} />
                  </div>

                </>}
              >
                <BadgeAvatarDisplay
                  collectionId={collectionId}
                  pageSize={cardView ? 1 : 10}
                  cardView={cardView}
                  addressOrUsernameToShowBalance={addressOrUsernameToShowBalance}
                  balance={addressOrUsernameToShowBalance ? balances : undefined}
                  badgeIds={balances.map((x) => x.badgeIds).flat()}
                  hideCollectionLink={hideCollectionLink}
                  showIds
                  showOnSinglePage
                />
              </InformationDisplayCard>
            </div>
          })
        }
      </div>
    </>

  } else {

    return <>
      {!hidePagination && <div className="flex-center"><Pagination currPage={currPage} total={total} pageSize={pageSize} onChange={setCurrPage} /></div>}

      <div className="flex-center flex-wrap">
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
                      {cardView ?
                        <BadgeCard
                          collectionId={badgeIdObj.collectionId}
                          badgeId={badgeId}
                          hideCollectionLink={hideCollectionLink}
                          key={idx}
                        /> :
                        <BadgeAvatar
                          size={70}
                          key={idx}
                          collectionId={badgeIdObj.collectionId}
                          badgeId={badgeId}
                          balances={
                            getBalancesForId(badgeId, (accountInfo?.collected.find(collected => collected.collectionId === badgeIdObj.collectionId)?.balances) ?? [])
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