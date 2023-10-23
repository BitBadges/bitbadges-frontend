import { Modal, Spin, Tooltip, Typography, notification } from "antd";
import { Balance, UintRange, deepCopy } from "bitbadgesjs-proto";
import { BitBadgesUserInfo, Numberify, getBadgesToDisplay, getBalancesForId, removeUintRangeFromUintRange, searchUintRangesForId, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";

import { CheckCircleFilled, CloseCircleFilled, SwapOutlined } from "@ant-design/icons";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateAccountInfo } from "../../bitbadges-api/api";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import { AddressDisplay } from "../address/AddressDisplay";
import { Pagination } from "../common/Pagination";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";
import { BadgeCard } from "./BadgeCard";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import IconButton from "../display/IconButton";

export function MultiCollectionBadgeDisplay({
  collectionIds,
  addressOrUsernameToShowBalance,
  cardView,
  defaultPageSize = 10,
  customPageBadges,
  groupByCollection,
  hideCollectionLink,
  hidePagination,
  showCustomizeButtons
}: {
  collectionIds: bigint[],
  addressOrUsernameToShowBalance?: string,
  cardView?: boolean,
  defaultPageSize?: number,

  groupByCollection?: boolean;
  hideCollectionLink?: boolean;
  hidePagination?: boolean;
  showCustomizeButtons?: boolean
  customPageBadges?: { collectionId: bigint, badgeIds: UintRange<bigint>[] }[]
}) {
  const divRef = useRef<HTMLDivElement>(null);

  const accountsContext = useAccountsContext();
  const collections = useCollectionsContext();
  const chain = useChainContext();
  const router = useRouter();
  const accountInfo = addressOrUsernameToShowBalance ? accountsContext.getAccount(addressOrUsernameToShowBalance) : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(defaultPageSize); //Total number of badges in badgeIds[]
  const [loaded, setLoaded] = useState<boolean>(false); //Total number of badges in badgeIds[]
  // const [pageSize, setPageSize] = useState<number>(defaultPageSize); //Total number of badges in badgeIds[]
  const pageSize = defaultPageSize

  //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]); // Badge IDs to display of length pageSize
  const badgesToShow = accountsContext.getBalancesView(accountInfo?.cosmosAddress ?? '', showCustomizeButtons ? 'badgesCollectedWithHidden' : 'badgesCollected') ?? []

  useEffect(() => {
    async function fetchAndUpdate() {
      const badgesToShow = accountsContext.getBalancesView(accountInfo?.cosmosAddress ?? '', showCustomizeButtons ? 'badgesCollectedWithHidden' : 'badgesCollected') ?? []
      let newPageSize = defaultPageSize;
      // if (!groupByCollection) {

      //   if (divRef.current && !cardView) {
      //     const divWidth = groupByCollection ? divRef.current?.offsetWidth : divRef.current?.offsetWidth;
      //     newPageSize = 3 * Math.floor(divWidth / 78); // Adjust as needed
      //   } else if (divRef.current && cardView) {
      //     const divWidth = groupByCollection ? divRef.current?.offsetWidth : divRef.current?.offsetWidth;
      //     newPageSize = 1 * Math.floor(divWidth / 220); // Adjust as needed
      //   }
      //   setPageSize(newPageSize);
      // }
      //Calculate badge IDs for each collection
      const allBadgeIds: {
        collectionId: bigint,
        badgeIds: UintRange<bigint>[]
      }[] = [];

      //If we have an account to show balances for, show that accounts balances
      //Else, show the entire collection
      if (customPageBadges) {
        for (const obj of customPageBadges) {
          allBadgeIds.push({
            badgeIds: obj.badgeIds.filter((badgeId, idx) => {
              return obj.badgeIds.findIndex(badgeId2 => badgeId2.start == badgeId.start && badgeId2.end == badgeId.end) == idx;
            }),
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
              balances = balances.map(x => {
                return {
                  ...x,
                  balances: x.balances.map(z => {
                    const shownBadge = shownBadges.find(y => y.collectionId == x.collectionId);
                    if (shownBadge) {
                      const [, removed] = removeUintRangeFromUintRange(shownBadge.badgeIds, z.badgeIds);
                      return {
                        ...z,
                        badgeIds: removed
                      }
                    } else {
                      return undefined;
                    }
                  }).filter(a => a !== undefined && a && a.badgeIds.length > 0) as Balance<bigint>[]
                }
              })
            } else {
              balances = balances.map(x => {
                return {
                  ...x,
                  balances: x.balances.map(z => {
                    const hiddenBadge = hiddenBadges.find(y => y.collectionId == x.collectionId);
                    if (hiddenBadge) {
                      const [remaining,] = removeUintRangeFromUintRange(hiddenBadge.badgeIds, z.badgeIds);
                      return {
                        ...z,
                        badgeIds: remaining
                      }
                    } else {
                      return z;
                    }
                  }).filter(a => a.badgeIds.length > 0)
                }
              })
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
          const balances = collections.collections[collectionId.toString()]?.owners?.find(x => x.cosmosAddress == 'Total')?.balances ?? [];
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
  }, [collectionIds, currPage, pageSize, accountInfo, groupByCollection, showCustomizeButtons, defaultPageSize, customPageBadges]);

  const CustomizeButtons = (badgeIdObj: { collectionId: bigint, badgeIds: UintRange<bigint>[] }, badgeId: bigint, onlyShowCollectionOptions?: boolean) => {
    const isHidden = accountInfo?.hiddenBadges?.find(x => {
      if (x.badgeIds.length == 0) return false;

      const [, found] = searchUintRangesForId(badgeId, x.badgeIds);
      return x.collectionId == badgeIdObj.collectionId && found
    }) !== undefined;

    const isShown = accountInfo?.shownBadges?.find(x => {
      if (x.badgeIds.length == 0) return false;

      const [, found] = searchUintRangesForId(badgeId, x.badgeIds);
      return x.collectionId == badgeIdObj.collectionId && found
    }) !== undefined;

    const isPinned = accountInfo?.customPages?.find(x => x.title == 'Pinned Badges')?.badges?.find(x => {
      if (x.badgeIds.length == 0) return false;

      const [, found] = searchUintRangesForId(badgeId, x.badgeIds);
      return x.collectionId == badgeIdObj.collectionId && found
    }) !== undefined;

    const addToArray = (arr: { collectionId: bigint, badgeIds: UintRange<bigint>[] }[], badgeIdsToAdd: UintRange<bigint>[]) => {
      const existingIdx = arr.findIndex(x => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].badgeIds = sortUintRangesAndMergeIfNecessary([...arr[existingIdx].badgeIds, ...badgeIdsToAdd])
      } else {
        arr.push({
          collectionId: badgeIdObj.collectionId,
          badgeIds: badgeIdsToAdd
        })
      }

      return arr.filter(x => x.badgeIds.length > 0);
    }

    const removeFromArray = (arr: { collectionId: bigint, badgeIds: UintRange<bigint>[] }[], badgeIdsToRemove: UintRange<bigint>[]) => {
      const existingIdx = arr.findIndex(x => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        const [remaining,] = removeUintRangeFromUintRange(badgeIdsToRemove, arr[existingIdx].badgeIds);
        arr[existingIdx].badgeIds = remaining;
      }
      return arr.filter(x => x.badgeIds.length > 0);
    }

    const getNewViews = (accountInfo: BitBadgesUserInfo<bigint>) => {
      if (!accountInfo.views.badgesCollectedWithHidden || !accountInfo.views.badgesCollected) return {
        ...accountInfo.views,
      }

      return {
        ...accountInfo.views,
        badgesCollectedWithHidden: {
          ...accountInfo.views.badgesCollectedWithHidden,

          ids: [...new Set([...(accountInfo.views.badgesCollectedWithHidden.ids || []), badgeIdObj.collectionId.toString() + ':' + chain.cosmosAddress])]
        },
        badgesCollected: {
          ...accountInfo.views.badgesCollected,

          ids: [...new Set([...(accountInfo.views.badgesCollected.ids || []), badgeIdObj.collectionId.toString() + ':' + chain.cosmosAddress])]
        }
      }
    }

    return <>{
      showCustomizeButtons &&
      <>


        {accountInfo && ((accountInfo.onlyShowApproved && isShown) || (!accountInfo.onlyShowApproved && !isHidden)) ?
          <>
            <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleFilled style={{ fontSize: 20, color: 'green' }} /> {' '}
              <Typography.Text strong className="primary-text" style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                Shown
              </Typography.Text>
            </div>
          </> : <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'center' }}>
            <CloseCircleFilled style={{ fontSize: 20, color: 'red' }} /> {' '}
            <Typography.Text strong className="primary-text" style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
              Hidden
            </Typography.Text>
          </div>
        }

        <div className="flex-center">
          {accountInfo &&
            <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'center' }}>

              {!onlyShowCollectionOptions && <>
                <IconButton

                  src={<SwapOutlined />}
                  text={(accountInfo.onlyShowApproved && isShown) || (!accountInfo.onlyShowApproved && !isHidden) ? 'Hide' : 'Show'}
                  onClick={async () => {
                    // if (!accountInfo.views.badgesCollectedWithHidden || !accountInfo.views.badgesCollected) return;

                    if (accountInfo.onlyShowApproved) {
                      const shownBadge = isShown ? removeFromArray(deepCopy(accountInfo.shownBadges ?? []), [{ start: badgeId, end: badgeId }]) : addToArray(deepCopy(accountInfo.shownBadges ?? []), [{ start: badgeId, end: badgeId }]);

                      await updateAccountInfo({
                        shownBadges: shownBadge
                      });

                      accountsContext.updateAccount(deepCopy({
                        ...accountInfo,
                        shownBadges: shownBadge,
                        views: getNewViews(accountInfo)
                      }))

                      notification.success({
                        message: "This badge will now be" + (isShown ? ' hidden' : ' shown') + " for your profile."
                      })

                    } else {
                      const hiddenBadge = isHidden ? removeFromArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]) : addToArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]);

                      await updateAccountInfo(deepCopy({
                        ...accountInfo,
                        hiddenBadges: hiddenBadge
                      }));

                      accountsContext.updateAccount(deepCopy({
                        ...accountInfo,
                        hiddenBadges: hiddenBadge,
                        views: getNewViews(accountInfo)
                      }))

                      notification.success({
                        message: "This badge will now be" + (!isHidden ? ' hidden' : ' shown') + " for your profile."
                      })
                    }
                  }
                  } />

              </>}

              <IconButton

                src={<SwapOutlined />}
                text={(accountInfo.onlyShowApproved && isShown) || (!accountInfo.onlyShowApproved && !isHidden) ? 'Hide Collection' : 'Show Collection'}
                onClick={async () => {

                  if (accountInfo.onlyShowApproved) {
                    const shownBadge = isShown ? removeFromArray(deepCopy(accountInfo.shownBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]) : addToArray(deepCopy(accountInfo.shownBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]);

                    await updateAccountInfo({
                      shownBadges: shownBadge
                    });

                    accountsContext.updateAccount(deepCopy({
                      ...accountInfo,
                      shownBadges: shownBadge,
                      views: getNewViews(accountInfo)
                    }))

                    notification.success({
                      message: "All badges from this collection will now be" + (isShown ? ' hidden' : ' shown') + " for your profile."
                    })
                  } else {
                    const hiddenBadge = isHidden ? removeFromArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]) : addToArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]);

                    await updateAccountInfo(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge
                    }));

                    accountsContext.updateAccount(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge,
                      views: getNewViews(accountInfo)
                    }))

                    notification.success({
                      message: "All badges from this collection will now be" + (!isHidden ? ' hidden' : ' shown') + " for your profile."
                    })
                  }
                }
                } />
              <IconButton

                src={<FontAwesomeIcon
                  icon={faThumbtack}
                />
                }
                text={(accountInfo.onlyShowApproved && isPinned) || (!accountInfo.onlyShowApproved && !isPinned) ? 'Pin' : 'Unpin'}
                onClick={async () => {
                  let pinnedPage = deepCopy(accountInfo.customPages?.find(x => x.title == 'Pinned Badges'));

                  if (isPinned) {
                    if (pinnedPage) {
                      const newBadgeIds = removeFromArray(deepCopy(pinnedPage.badges), [{ start: badgeId, end: badgeId }]);
                      pinnedPage.badges = newBadgeIds;
                    }
                  } else {
                    if (pinnedPage) {
                      const newBadgeIds = addToArray(deepCopy(pinnedPage.badges), [{ start: badgeId, end: badgeId }]);
                      pinnedPage.badges = newBadgeIds;
                    } else {
                      pinnedPage = {
                        title: 'Pinned Badges',
                        description: 'Badges pinned to your profile.',
                        badges: [
                          { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: badgeId, end: badgeId }] }
                        ]
                      }
                    }
                  }

                  if (pinnedPage === undefined) return;
                  await updateAccountInfo({
                    customPages:
                      accountInfo.customPages?.find(x => x.title == 'Pinned Badges') ?
                        accountInfo.customPages?.map(x => x.title == 'Pinned Badges' && pinnedPage ? pinnedPage : x) :
                        [...(accountInfo.customPages ?? []), pinnedPage]
                  });

                  accountsContext.updateAccount(deepCopy({
                    ...accountInfo,
                    customPages:
                      accountInfo.customPages?.find(x => x.title == 'Pinned Badges') ?
                        accountInfo.customPages?.map(x => x.title == 'Pinned Badges' && pinnedPage ? pinnedPage : x) :
                        [...(accountInfo.customPages ?? []), pinnedPage]
                  }))

                }
                } />
            </div>
          }
        </div>
      </>
    }
    </>
  }



  if (groupByCollection) {
    return <>
      {!hidePagination && <><Pagination currPage={currPage} total={total} pageSize={pageSize} onChange={setCurrPage} />
      </>}
      <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
        {
          collectionIds.map((collectionId, idx) => {
            const collection = collections.collections[collectionId.toString()];
            const balances = accountInfo ? badgesToShow.find(collected => collected.collectionId == collectionId)?.balances ?? []
              : collection?.owners.find(x => x.cosmosAddress == 'Total')?.balances ?? [];
            if (balances.length == 0) return <></>;

            ///Little hacky way to not trigger the first fetch in BadgeAvatarDisplay in favor of the batch fetch from this file
            if (!loaded) return <Spin />

            return <InformationDisplayCard title='' key={idx} style={{ margin: 8, alignItems: 'normal' }} >
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
                {collection &&
                  <div className="flex-center">
                    <Typography.Text className="primary-text" style={{ fontWeight: 'bold', marginRight: 10 }}>
                      By:
                    </Typography.Text>
                    <AddressDisplay addressOrUsername={collection.createdBy} fontSize={14} />
                  </div>}
                <br />
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
              // doNotFetchMetadata
              />
              {CustomizeButtons({ collectionId, badgeIds: balances.map((x) => x.badgeIds).flat() }, 1n, true)}
            </InformationDisplayCard>
          })
        }
      </div>
    </>


  } else {

    return <>
      {!hidePagination && <div className="flex-center" ref={divRef}><Pagination currPage={currPage} total={total} pageSize={pageSize} onChange={setCurrPage} /></div>}


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
                          {CustomizeButtons(badgeIdObj, badgeId)}

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