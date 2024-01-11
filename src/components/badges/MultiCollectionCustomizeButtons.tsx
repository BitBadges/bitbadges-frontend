import { EyeOutlined } from "@ant-design/icons";
import { notification } from "antd";
import { UintRange, deepCopy } from "bitbadgesjs-proto";
import { BatchBadgeDetails, BitBadgesUserInfo, CustomPage, addToBatchArray as addTobatchArrayImported, allInBatchArray, removeFromBatchArray as removeFromBatchArrayImported } from "bitbadgesjs-utils";
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
  const isHidden = allInBatchArray(accountInfo?.hiddenBadges ?? [], { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: badgeId, end: badgeId }] });
  const isCollectionHidden = allInBatchArray(accountInfo?.hiddenBadges ?? [], { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }] });

  //Just wrappers for the imported functions auto-adding badgeIdObj.collectionId
  //Should change these in future
  const addToBatchArray = (arr: BatchBadgeDetails<bigint>[], badgeIdsToAdd: UintRange<bigint>[]) => {
    return addTobatchArrayImported(arr, [{ collectionId: badgeIdObj.collectionId, badgeIds: badgeIdsToAdd }]);
  }

  const removeFromBatchArray = (arr: BatchBadgeDetails<bigint>[], badgeIdsToRemove: UintRange<bigint>[]) => {
    return removeFromBatchArrayImported(arr, [{ collectionId: badgeIdObj.collectionId, badgeIds: badgeIdsToRemove }]);
  }

  const isOnPage = (pageTitle: string, pages: CustomPage<bigint>[]) => {
    return allInBatchArray(pages?.find(x => x.title == pageTitle)?.items ?? [], badgeId ? { collectionId: badgeIdObj.collectionId, badgeIds: [{ start: badgeId, end: badgeId }] } : badgeIdObj);
  }

  const pages = isWatchlist ? accountInfo?.watchlists?.badges ?? [] : accountInfo?.customPages?.badges ?? [];

  return <>{
    showCustomizeButtons &&
    <>
      <div className="">
        {accountInfo &&
          <div className='flex-center flex-column' style={{ alignItems: 'center', justifyContent: 'center' }}>

            {!onlyShowCollectionOptions && !isWatchlist && <b>Hidden</b>}
            <div className="flex-center">

              {!onlyShowCollectionOptions && !isWatchlist && <>
                <IconButton
                  secondary
                  src={!isHidden ? <EyeOutlined style={{ fontSize: 18 }} />
                    : <EyeOutlined style={{ color: 'red', fontSize: 18 }} />}
                  text={'Badge'}
                  tooltipMessage={!isHidden ? 'Hide this badge from your profile.' : 'Show this badge on your profile.'}
                  onClick={async () => {
                    const hiddenBadge = !isHidden ? addToBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]) : removeFromBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: badgeId, end: badgeId }]);

                    await updateAccountInfo(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge
                    }));

                    updateAccount(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge,
                    }))

                    notification.success({
                      message: "This badge will now be" + (!isHidden ? ' hidden' : ' shown') + " for your profile.",
                      description: "A page refresh may be required to see the changes."
                    })
                  }}
                />
              </>}

              {!isWatchlist && <>
                <IconButton
                  secondary
                  src={!isCollectionHidden ? <EyeOutlined style={{ fontSize: 18 }} />
                    : <EyeOutlined style={{ color: 'red', fontSize: 18 }} />}
                  text={'Collection'}
                  tooltipMessage={!isCollectionHidden ? 'Hide all badges from this collection from your profile.' : 'Show all badges from this collection on your profile.'}
                  onClick={async () => {
                    const hiddenBadge = !isCollectionHidden ? addToBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]) : removeFromBatchArray(deepCopy(accountInfo.hiddenBadges ?? []), [{ start: 1n, end: GO_MAX_UINT_64 }]);

                    await updateAccountInfo(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge
                    }));

                    updateAccount(deepCopy({
                      ...accountInfo,
                      hiddenBadges: hiddenBadge,
                    }))

                    notification.success({
                      message: "All badges from this collection will now be" + (!isCollectionHidden ? ' hidden' : ' shown') + " for your profile.",
                      description: "A page refresh may be required to see the changes."
                    })
                  }}
                />

              </>}
            </div>
          </div>
        }
        {pages.length > 0 && <>
          <b>Pages</b>
          {(pages ?? [])?.length == 0 && <EmptyIcon description='No created pages yet.' />}

          <div className="flex-center flex-wrap">
            {pages?.map((x, idx) => {
              const pageName = x.title;
              const addedToPage = isOnPage(pageName, pages);
              return <div
                key={idx}
                className='flex-center flex-column primary-text' style={{ alignItems: 'center', }}>
                <IconButton
                  secondary
                  src={addedToPage ? <EyeOutlined style={{ fontSize: 18 }} />
                    : <EyeOutlined style={{ color: 'red', fontSize: 18 }} />}
                  text={pageName}
                  tooltipMessage={addedToPage ? 'Remove this badge from this page.' : 'Add this badge to this page.'}
                  onClick={async () => {
                    const deepCopiedPages = deepCopy(pages);
                    if (!addedToPage) {
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
          </div>
        </>}

      </div>
    </>
  }
  </>
}