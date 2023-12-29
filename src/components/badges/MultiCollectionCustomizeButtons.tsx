import { CheckCircleFilled, CloseCircleFilled, EditOutlined, MinusOutlined } from "@ant-design/icons";
import { Switch, notification } from "antd";
import { UintRange, deepCopy } from "bitbadgesjs-proto";
import { BitBadgesUserInfo, removeUintRangeFromUintRange } from "bitbadgesjs-utils";
import { useState } from "react";
import { updateAccountInfo } from "../../bitbadges-api/api";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { updateAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import {
  BatchBadgeDetails, addToArray as addToArrayImported,
  removeFromArray as removeFromArrayImported
} from "../../pages/account/[addressOrUsername]";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import { EmptyIcon } from "../common/Empty";
import IconButton from "../display/IconButton";

const inArray = (arr: BatchBadgeDetails[], badgeIdObj: BatchBadgeDetails) => {
  return arr.find(x => {
    if (x.badgeIds.length == 0) return false;

    const [remaining] = removeUintRangeFromUintRange(x.badgeIds, badgeIdObj.badgeIds);
    return x.collectionId == badgeIdObj.collectionId && remaining.length == 0
  }) !== undefined;
}

export const CustomizeButtons =
  ({ accountInfo, badgeIdObj, badgeId, onlyShowCollectionOptions, showCustomizeButtons, isWatchlist }: {
    accountInfo?: BitBadgesUserInfo<bigint>,
    badgeIdObj: BatchBadgeDetails,
    badgeId: bigint,
    onlyShowCollectionOptions?: boolean
    showCustomizeButtons?: boolean,
    isWatchlist?: boolean
  }) => {

    const chain = useChainContext();
    const [addToPageIsVisible, setAddToPageIsVisible] = useState(false);

    const isHidden = inArray(accountInfo?.hiddenBadges ?? [], { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: badgeId, end: badgeId }] });
    const isCollectionHidden = inArray(accountInfo?.hiddenBadges ?? [], { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }] });

    //Just wrappers for the imported functions auto-adding badgeIdObj.collectionId
    const addToArray = (arr: BatchBadgeDetails[], badgeIdsToAdd: UintRange<bigint>[]) => {
      return addToArrayImported(arr, [{ collectionId: badgeIdObj.collectionId, badgeIds: badgeIdsToAdd }]);
    }

    const removeFromArray = (arr: BatchBadgeDetails[], badgeIdsToRemove: UintRange<bigint>[]) => {
      return removeFromArrayImported(arr, [{ collectionId: badgeIdObj.collectionId, badgeIds: badgeIdsToRemove }]);
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

    const pages = isWatchlist ? accountInfo?.watchedBadgePages ?? [] : accountInfo?.customPages ?? [];

    const isOnPage = (pageTitle: string) => {
      return inArray(pages?.find(x => x.title == pageTitle)?.badges ?? [], badgeIdObj);
    }

    return <>{
      showCustomizeButtons &&
      <>
        <div className="">
          {accountInfo &&
            <div className='flex-center flex-column' style={{ alignItems: 'center', justifyContent: 'center' }}>

              {!onlyShowCollectionOptions && !isWatchlist && <>
                <Switch
                  style={{ marginBottom: 10 }}
                  checkedChildren="Show Badge"
                  unCheckedChildren="Hide Badge"
                  checked={!isHidden}
                  onChange={async (checked) => {
                    const hiddenBadge = checked ? removeFromArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]) : addToArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]);

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
                      message: "This badge will now be" + (checked ? ' shown' : ' hidden') + " for your profile."
                    })

                  }}
                />

              </>}

              {!isWatchlist && <>
                <Switch
                  style={{ marginBottom: 10 }}
                  checkedChildren="Show Collection"
                  unCheckedChildren="Hide Collection"
                  checked={!isCollectionHidden}
                  onChange={async (checked) => {
                    const hiddenBadge = checked ? removeFromArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]) : addToArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]);

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
                      message: "All badges from this collection will now be" + (checked ? ' shown' : ' hidden') + " for your profile."
                    })
                  }}
                />

              </>}
              <IconButton
                src={addToPageIsVisible ? <MinusOutlined /> : <EditOutlined />}
                text={'Pages'}
                onClick={() => setAddToPageIsVisible(!addToPageIsVisible)}
              />
            </div>
          }
          {addToPageIsVisible && <>
            {(pages ?? [])?.length == 0 && <EmptyIcon description='No created pages yet.' />}
            {pages?.map((x, idx) => {
              const pageName = x.title;
              const addedToPage = isOnPage(pageName);

              return <div
                key={idx}
                className='flex-center flex-column primary-text' style={{ alignItems: 'center', padding: 10, marginBottom: 10 }}>
                <div className="flex-center" style={{ alignItems: 'center', marginBottom: 5, }}>
                  {addedToPage ? <CheckCircleFilled style={{ fontSize: 20, color: 'green', marginRight: 2 }} /> : <>
                    <CloseCircleFilled style={{ fontSize: 20, color: 'red', marginRight: 2 }} />
                  </>}

                  {pageName}
                </div>
                <Switch
                  checkedChildren="Added"
                  unCheckedChildren="Not Added"
                  checked={addedToPage}
                  onChange={async (checked) => {
                    if (checked) {
                      const newBadgeIds = addToArray(deepCopy(x.badges), [{ start: badgeId, end: badgeId }]);
                      x.badges = newBadgeIds;
                    } else {
                      const newBadgeIds = removeFromArray(deepCopy(x.badges), [{ start: badgeId, end: badgeId }]);
                      x.badges = newBadgeIds;
                    }

                    if (!accountInfo) return;
                    await updateAccountInfo({
                      customPages: isWatchlist ? accountInfo.customPages : pages,
                      watchedBadgePages: isWatchlist ? pages : accountInfo.watchedBadgePages
                    });

                    updateAccount(deepCopy({
                      ...accountInfo,
                      customPages: isWatchlist ? accountInfo.customPages : pages,
                      watchedBadgePages: isWatchlist ? pages : accountInfo.watchedBadgePages
                    }))
                  }}
                />

              </div>
            }
            )}
          </>}
        </div>
      </>
    }
    </>
  }