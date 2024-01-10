import { CheckCircleFilled, CloseCircleFilled, EditOutlined, MinusOutlined } from "@ant-design/icons";
import { Switch, notification } from "antd";
import { UintRange, deepCopy } from "bitbadgesjs-proto";
import { BatchBadgeDetails, BitBadgesUserInfo, CustomPage, addToBatchArray as addTobatchArrayImported, inBatchArray, removeFromBatchArray as removeFromBatchArrayImported } from "bitbadgesjs-utils";
import { useState } from "react";
import { updateAccountInfo } from "../../bitbadges-api/api";
import { updateAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import { EmptyIcon } from "../common/Empty";
import IconButton from "../display/IconButton";



export const CustomizeButtons = ({ accountInfo, badgeIdObj, badgeId, onlyShowCollectionOptions, showCustomizeButtons, isWatchlist }: {
  accountInfo?: BitBadgesUserInfo<bigint>,
  badgeIdObj: BatchBadgeDetails<bigint>,
  badgeId: bigint,
  onlyShowCollectionOptions?: boolean
  showCustomizeButtons?: boolean,
  isWatchlist?: boolean
}) => {

  const [addToPageIsVisible, setAddToPageIsVisible] = useState(false);

  const isHidden = inBatchArray(accountInfo?.hiddenBadges ?? [], { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: badgeId, end: badgeId }] });
  const isCollectionHidden = inBatchArray(accountInfo?.hiddenBadges ?? [], { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }] });

  //Just wrappers for the imported functions auto-adding badgeIdObj.collectionId
  //Should change these in future
  const addToBatchArray = (arr: BatchBadgeDetails<bigint>[], badgeIdsToAdd: UintRange<bigint>[]) => {
    return addTobatchArrayImported(arr, [{ collectionId: badgeIdObj.collectionId, badgeIds: badgeIdsToAdd }]);
  }

  const removeFromBatchArray = (arr: BatchBadgeDetails<bigint>[], badgeIdsToRemove: UintRange<bigint>[]) => {
    return removeFromBatchArrayImported(arr, [{ collectionId: badgeIdObj.collectionId, badgeIds: badgeIdsToRemove }]);
  }

  const isOnPage = (pageTitle: string, pages: CustomPage<bigint>[]) => {
    return inBatchArray(pages?.find(x => x.title == pageTitle)?.items ?? [], badgeId ? { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: badgeId, end: badgeId }] } : badgeIdObj);
  }

  const pages = isWatchlist ? accountInfo?.watchlists?.badges ?? [] : accountInfo?.customPages?.badges ?? [];

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
                  const hiddenBadge = checked ? removeFromBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]) : addToBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]);

                  await updateAccountInfo(deepCopy({
                    ...accountInfo,
                    hiddenBadges: hiddenBadge
                  }));

                  updateAccount(deepCopy({
                    ...accountInfo,
                    hiddenBadges: hiddenBadge,
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
                  const hiddenBadge = checked ? removeFromBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]) : addToBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]);

                  await updateAccountInfo(deepCopy({
                    ...accountInfo,
                    hiddenBadges: hiddenBadge
                  }));

                  updateAccount(deepCopy({
                    ...accountInfo,
                    hiddenBadges: hiddenBadge,
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
            const addedToPage = isOnPage(pageName, pages);

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
                  const deepCopiedPages = deepCopy(pages);
                  if (checked) {
                    const newBadgeIds = addToBatchArray(deepCopy(x.items), [{ start: badgeId, end: badgeId }]);
                    deepCopiedPages[idx].items = newBadgeIds;
                  } else {
                    const newBadgeIds = removeFromBatchArray(deepCopy(x.items), [{ start: badgeId, end: badgeId }]);
                    deepCopiedPages[idx].items = newBadgeIds;
                  }

                  if (!accountInfo) return;

                  await updateAccountInfo({
                    customPages: isWatchlist ? accountInfo.customPages : {
                      lists: accountInfo.customPages?.lists ?? [],
                      badges: deepCopiedPages,
                    },
                    watchlists: isWatchlist ? {
                      badges: deepCopiedPages,
                      lists: accountInfo.watchlists?.lists ?? []
                    } : accountInfo.watchlists
                  });

                  updateAccount(deepCopy({
                    ...accountInfo,
                    customPages: isWatchlist ? accountInfo.customPages : {
                      lists: accountInfo.customPages?.lists ?? [],
                      badges: deepCopiedPages,
                    },
                    watchlists: isWatchlist ? {
                      badges: deepCopiedPages,
                      lists: accountInfo.watchlists?.lists ?? []
                    } : accountInfo.watchlists
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