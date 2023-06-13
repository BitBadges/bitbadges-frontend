import { Modal, Tooltip } from "antd";
import { IdRange } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";

import { Pagination } from "../common/Pagination";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";
import { BadgeCard } from "./BadgeCard";
import { INFINITE_LOOP_MODE } from "../../constants";

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
  const collectionsContext = useCollectionsContext();
  const collectionsRef = useRef(collectionsContext);
  const router = useRouter();
  const accountInfo = addressOrUsernameToShowBalance ? accountsContext.getAccount(addressOrUsernameToShowBalance) : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

  //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<{
    collectionId: bigint,
    badgeIds: IdRange<bigint>[]
  }[]>([]); // Badge IDs to display of length pageSize

  useEffect(() => {
    if (groupByCollection) {
      return;
    }

    //Is there a way we can not depend on accountsContext with no errors?
    if (!accountInfo) return;

    //Calculate badge IDs for each collection
    const allBadgeIds: {
      collectionId: bigint,
      badgeIds: IdRange<bigint>[]
    }[] = [];
    for (const collectionId of collectionIds) {
      const balances = accountInfo?.collected.flat() ?? [];
      if (balances) {
        const balanceInfo = balances.find(balance => balance.collectionId === collectionId);
        for (const balance of balanceInfo?.balances || []) {
          allBadgeIds.push({
            badgeIds: balance.badgeIds,
            collectionId
          });
        }
      }
    }

    //Calculate total number of badge IDs
    let total = 0;
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
      badgeIds: IdRange<bigint>[]
    }[] = getBadgesToDisplay(allBadgeIds, currPage, pageSize);
    setBadgeIdsToDisplay(badgeIdsToDisplay);

    for (const badgeIdObj of badgeIdsToDisplay) {
      collectionsRef.current.fetchAndUpdateMetadata(badgeIdObj.collectionId, { badgeIds: badgeIdObj.badgeIds });
    }

    if (INFINITE_LOOP_MODE) console.log("MultiCollectionBadgeDisplay: useEffect: badgeIdsToDisplay: ", badgeIdsToDisplay);

    //Note still depends on a context (accountInfo / accountsContext).
  }, [collectionIds, currPage, pageSize, accountInfo, groupByCollection]);

  if (groupByCollection) {
    return <>
      {!hidePagination && <Pagination currPage={currPage} total={total} pageSize={pageSize} onChange={setCurrPage} />}
      <br />

      <div className="flex-center flex-wrap">
        {
          collectionIds.map((collectionId, idx) => {
            const collection = collectionsContext.getCollection(collectionId);

            return <div key={idx} style={{ width: 350, margin: 10, display: 'flex' }}>
              {/*
                //TODO: Sync with CollectionDisplay
              */}
              <InformationDisplayCard
                noBorder
                title={<>
                  <Tooltip color='black' title={"Collection ID: " + collectionId} placement="bottom">
                    <div className='link-button-nav' onClick={() => {
                      router.push('/collections/' + collectionId)
                      Modal.destroyAll()
                    }} style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <BadgeAvatar
                        size={250}
                        collectionId={collectionId}
                      />
                      <br />
                      {collection?.collectionMetadata?.name}
                    </div>
                  </Tooltip>
                  <br />
                </>}
              >
                <BadgeAvatarDisplay
                  collectionId={collectionId}
                  pageSize={cardView ? 1 : 10}
                  cardView={cardView}
                  addressOrUsernameToShowBalance={addressOrUsernameToShowBalance}

                  badgeIds={badgeIdsToDisplay.map((x) => x.badgeIds).flat()}
                  hideCollectionLink={hideCollectionLink}
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
      =
      <div className="flex-center flex-wrap">
        {
          badgeIdsToDisplay.map((badgeIdObj) => {
            return <>
              {badgeIdObj.badgeIds.map((badgeIdRange, idx) => {
                const badgeIds: bigint[] = [];
                for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
                  badgeIds.push(i);
                }
                return <div key={idx} className="flex-between">
                  {badgeIds.map((badgeId) => {
                    return <div key={idx} className="flex-between">
                      {cardView ?
                        <BadgeCard
                          collectionId={badgeIdObj.collectionId}
                          badgeId={badgeId}
                          hideCollectionLink={hideCollectionLink}
                        /> :
                        <BadgeAvatar
                          size={70}
                          collectionId={badgeIdObj.collectionId}
                          badgeId={badgeId}
                          balance={accountInfo?.collected.find(collected => collected.collectionId === badgeIdObj.collectionId)?.balances.find(balance => balance.badgeIds.find(id => id.start <= badgeId && id.end >= badgeId))?.amount}
                        />
                      }
                    </div>
                  })}
                </div>
              })}
            </>
          })
        }
      </div>
    </>
  }
}