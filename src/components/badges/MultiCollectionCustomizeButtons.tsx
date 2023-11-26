import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, EditOutlined, MinusOutlined, PlusOutlined, SwapOutlined } from "@ant-design/icons";
import { notification } from "antd";
import { UintRange, deepCopy } from "bitbadgesjs-proto";
import { BitBadgesUserInfo, removeUintRangeFromUintRange, searchUintRangesForId, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useState } from "react";
import { updateAccountInfo } from "../../bitbadges-api/api";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { updateAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import { EmptyIcon } from "../common/Empty";
import IconButton from "../display/IconButton";

export const CustomizeButtons =
  ({ accountInfo, badgeIdObj, badgeId, onlyShowCollectionOptions, showCustomizeButtons }: {
    accountInfo?: BitBadgesUserInfo<bigint>,
    badgeIdObj: { collectionId: bigint, badgeIds: UintRange<bigint>[] },
    badgeId: bigint,
    onlyShowCollectionOptions?: boolean
    showCustomizeButtons?: boolean
  }) => {

    const chain = useChainContext();
    const [addToPageIsVisible, setAddToPageIsVisible] = useState(false);

    const isHidden = accountInfo?.hiddenBadges?.find(x => {
      if (x.badgeIds.length == 0) return false;

      const [, found] = searchUintRangesForId(badgeId, x.badgeIds);
      return x.collectionId == badgeIdObj.collectionId && found
    }) !== undefined;

    const isCollectionHidden = accountInfo?.hiddenBadges?.find(x => {
      if (x.badgeIds.length == 0) return false;

      const [remaining] = removeUintRangeFromUintRange(x.badgeIds, [{ start: 1n, end: GO_MAX_UINT_64 }]);
      return x.collectionId == badgeIdObj.collectionId && remaining.length == 0
    }) !== undefined;

    const addToArray = (arr: { collectionId: bigint, badgeIds: UintRange<bigint>[] }[], badgeIdsToAdd: UintRange<bigint>[]) => {
      const existingIdx = arr.findIndex(x => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].badgeIds = sortUintRangesAndMergeIfNecessary([...arr[existingIdx].badgeIds, ...badgeIdsToAdd], true)
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

    const isOnPage = (pageTitle: string) => {
      return accountInfo?.customPages?.find(x => x.title == pageTitle)?.badges?.find(x => {
        if (x.badgeIds.length == 0) return false;

        const [, found] = searchUintRangesForId(badgeId, x.badgeIds);
        return x.collectionId == badgeIdObj.collectionId && found
      }
      ) !== undefined;
    }

    return <>{
      showCustomizeButtons &&
      <>


        {/* {accountInfo && ((accountInfo.onlyShowApproved && isShown) || (!accountInfo.onlyShowApproved && !isHidden)) ?
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
        } */}

        <div className="">
          {accountInfo &&
            <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'center' }}>

              {!onlyShowCollectionOptions && <>
                <IconButton

                  src={<SwapOutlined />}
                  text={(!isHidden) ? 'Hide' : 'Show'}
                  onClick={async () => {
                    // if (!accountInfo.views.badgesCollectedWithHidden || !accountInfo.views.badgesCollected) return;

                    
                      const hiddenBadge = isHidden ? removeFromArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]) : addToArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]);

                      await updateAccountInfo(deepCopy({
                        ...accountInfo,
                        hiddenBadges: hiddenBadge
                      }));

                      updateAccount(deepCopy({
                        ...accountInfo,
                        hiddenBadges: hiddenBadge,
                        views: getNewViews(accountInfo)
                      }))

                      notification.success({
                        message: "This badge will now be" + (!isHidden ? ' hidden' : ' shown') + " for your profile."
                      })
                    
                  }
                  } />

              </>}

              <IconButton

                src={<SwapOutlined />}
                text={(!isCollectionHidden) ? 'Hide Collection' : 'Show Collection'}
                onClick={async () => {

                  
                    const hiddenBadge = isHidden ? removeFromArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]) : addToArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]);

                    await updateAccountInfo(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge
                    }));

                    updateAccount(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge,
                      views: getNewViews(accountInfo)
                    }))

                    notification.success({
                      message: "All badges from this collection will now be" + (!isHidden ? ' hidden' : ' shown') + " for your profile."
                    })
                  
                }
                } />
              <IconButton
                src={addToPageIsVisible ? <MinusOutlined /> : <EditOutlined />}
                text={'Pages'}
                onClick={() => setAddToPageIsVisible(!addToPageIsVisible)}
              />




            </div>
          }
          {addToPageIsVisible && <>

            <br />
            {(accountInfo?.customPages ?? [])?.length == 0 && <EmptyIcon description='No created pages yet.' />}
            {accountInfo?.customPages?.map((x, idx) => {
              const pageName = x.title;
              const addedToPage = isOnPage(pageName);

              return <div
                key={idx}
                className='flex-between primary-text' style={{ alignItems: 'center', borderBottom: '1px solid #e8e8e8', padding: 10 }}>
                <div className="flex" style={{ alignItems: 'center', }}>
                  {addedToPage ? <CheckCircleFilled style={{ fontSize: 20, color: 'green', marginRight: 2 }} /> : <>
                    <CloseCircleFilled style={{ fontSize: 20, color: 'red', marginRight: 2 }} />
                  </>}

                  {pageName}
                </div>

                <IconButton

                  src={
                    addedToPage ?
                      <DeleteOutlined /> :
                      <PlusOutlined />
                  }
                  text={''}
                  tooltipMessage={addedToPage ? 'Remove from page' : 'Add to page'}
                  onClick={async () => {
                    let pinnedPage = deepCopy(accountInfo.customPages?.find(x => x.title == pageName));

                    if (addedToPage) {
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
                          title: pageName,
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
                        accountInfo.customPages?.find(x => x.title == pageName) ?
                          accountInfo.customPages?.map(x => x.title == pageName && pinnedPage ? pinnedPage : x) :
                          [...(accountInfo.customPages ?? []), pinnedPage]
                    });

                    updateAccount(deepCopy({
                      ...accountInfo,
                      customPages:
                        accountInfo.customPages?.find(x => x.title == pageName) ?
                          accountInfo.customPages?.map(x => x.title == pageName && pinnedPage ? pinnedPage : x) :
                          [...(accountInfo.customPages ?? []), pinnedPage]
                    }))

                  }
                  } />
              </div>
            }
            )}


          </>}
        </div>
      </>
    }
    </>
  }