import { Col, Modal, Row, Spin, Tooltip, Typography } from "antd";
import { UintRange } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay, getBalancesForId } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";

import { INFINITE_LOOP_MODE } from "../../constants";
import { Pagination } from "../common/Pagination";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";
import { BadgeCard } from "./BadgeCard";

export function MultiCollectionBadgeDisplay({
  collectionIds,
  addressOrUsernameToShowBalance,
  cardView,
  defaultPageSize = 25,

  groupByCollection,
  hideCollectionLink,
  hidePagination
}: {
  collectionIds: bigint[],
  addressOrUsernameToShowBalance?: string,
  cardView?: boolean,
  defaultPageSize?: number,

  groupByCollection?: boolean;
  hideCollectionLink?: boolean;
  hidePagination?: boolean;

}) {
  const divRef = useRef<HTMLDivElement>(null);
  const collectionGroupDivRef = useRef<HTMLDivElement>(null);

  const accountsContext = useAccountsContext();
  const collections = useCollectionsContext();
  const router = useRouter();
  const accountInfo = addressOrUsernameToShowBalance ? accountsContext.getAccount(addressOrUsernameToShowBalance) : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(defaultPageSize); //Total number of badges in badgeIds[]
  const [loaded, setLoaded] = useState<boolean>(false); //Total number of badges in badgeIds[]
  const [pageSize, setPageSize] = useState<number>(defaultPageSize); //Total number of badges in badgeIds[]

  //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]); // Badge IDs to display of length pageSize

  useEffect(() => {
    async function fetchAndUpdate() {
      let newPageSize = pageSize;
      if (!groupByCollection) {

        if (divRef.current && !cardView) {
          const divWidth = groupByCollection ? divRef.current?.offsetWidth : divRef.current?.offsetWidth;
          newPageSize = 3 * Math.floor(divWidth / 78); // Adjust as needed
        } else if (divRef.current && cardView) {
          const divWidth = groupByCollection ? divRef.current?.offsetWidth : divRef.current?.offsetWidth;
          newPageSize = 1 * Math.floor(divWidth / 220); // Adjust as needed
        }
        setPageSize(newPageSize);
      }
      //Calculate badge IDs for each collection
      const allBadgeIds: {
        collectionId: bigint,
        badgeIds: UintRange<bigint>[]
      }[] = [];

      //If we have an account to show balances for, show that accounts balances
      //Else, show the entire collection
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

      //Calculate total number of badge IDs  to display
      let total = 0;
      if (!groupByCollection) {
        //If we do not group by collection, we calculate according to pageSize


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
        }[] = getBadgesToDisplay(allBadgeIds, currPage, newPageSize);
        setBadgeIdsToDisplay(badgeIdsToDisplay);

        await collections.batchFetchAndUpdateMetadata(badgeIdsToDisplay.map(x => {
          return {
            collectionId: x.collectionId,
            metadataToFetch: {
              badgeIds: x.badgeIds
            },
          }
        }));

        setLoaded(true);
      } else {
        //If we group by collection, we calculate according to the default view (10 badges per collection)
        //Note this is a hacky way to do this, but it works for now
        //We fetch the initial badges for each collection in a single batch request and use loaded to not trigger the inital fetch in BadgeAvatarDisplay
        //Any subsequent fetches will be done in BadgeAvatarDisplay

        await collections.batchFetchAndUpdateMetadata(allBadgeIds.map(x => {
          return {
            collectionId: x.collectionId,
            metadataToFetch: {
              badgeIds: [{ start: 1n, end: newPageSize }]
            },
          }
        }));

        setLoaded(true);
      }
    }

    if (INFINITE_LOOP_MODE) console.log("MultiCollectionBadgeDisplay: useEffect: badgeIdsToDisplay: ", badgeIdsToDisplay);
    fetchAndUpdate();
    //Note still depends on a context (accountInfo / accountsContext).
  }, [collectionIds, currPage, pageSize, accountInfo, groupByCollection]);


  if (groupByCollection) {
    return <>
      {!hidePagination && <Pagination currPage={currPage} total={total} pageSize={pageSize} onChange={setCurrPage} />}
      <br />

      <Row className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }} >
        {
          collectionIds.map((collectionId, idx) => {
            const collection = collections.collections[collectionId.toString()];
            const balances = accountInfo ? accountInfo?.collected.find(collected => collected.collectionId === collectionId)?.balances ?? []
              : collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
            console.log(accountInfo);
            if (balances.length === 0) return <></>;

            ///Little hacky way to not trigger the first fetch in BadgeAvatarDisplay in favor of the batch fetch from this file
            if (!loaded) return <Spin />

            return <Col key={idx} style={{ padding: 10, display: 'flex', justifyContent: 'center', width: '100%' }} xxl={6} xl={6} lg={6} md={12} xs={24} sm={24} >
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
                      <Typography.Text className="primary-text" style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 10 }}>

                        {collection?.cachedCollectionMetadata?.name}
                      </Typography.Text>
                    </div>

                  </Tooltip>
                </>}
                style={{ width: '100%' }}
              >
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
                // doNotFetchMetadata
                />
              </InformationDisplayCard>
            </Col>
          })
        }
      </Row >
    </>

  } else {

    return <>
      {!hidePagination && <div className="flex-center" ref={divRef}><Pagination currPage={currPage} total={total} pageSize={pageSize} onChange={setCurrPage} /></div>}

      <div className="flex-center flex-wrap full-width"  >
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
                          // showId={!!addressOrUsernameToShowBalance}
                          showSupplys={!!addressOrUsernameToShowBalance}
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