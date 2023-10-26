import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Typography, notification } from "antd";
import { UintRange, deepCopy } from "bitbadgesjs-proto";
import { BitBadgesUserInfo, removeUintRangeFromUintRange, searchUintRangesForId, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { CheckCircleFilled, CloseCircleFilled, SwapOutlined } from "@ant-design/icons";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import IconButton from "../display/IconButton";
import { updateAccountInfo } from "../../bitbadges-api/api";

export const CustomizeButtons =
  ({ accountInfo, badgeIdObj, badgeId, onlyShowCollectionOptions, showCustomizeButtons }: {
    accountInfo?: BitBadgesUserInfo<bigint>,
    badgeIdObj: { collectionId: bigint, badgeIds: UintRange<bigint>[] },
    badgeId: bigint,
    onlyShowCollectionOptions?: boolean
    showCustomizeButtons?: boolean
  }) => {

    const chain = useChainContext();
    const accountsContext = useAccountsContext();

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

    return <>{
      showCustomizeButtons &&
      <>


        {accountInfo && ((accountInfo.onlyShowApproved && isShown) || (!accountInfo.onlyShowApproved && !isHidden)) ?
          <>
            <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleFilled style={{ fontSize: 20, color: 'green' }} /> {' '}
              <Typography.Text strong className="dark:text-white" style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                Shown
              </Typography.Text>
            </div>
          </> : <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'center' }}>
            <CloseCircleFilled style={{ fontSize: 20, color: 'red' }} /> {' '}
            <Typography.Text strong className="dark:text-white" style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
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