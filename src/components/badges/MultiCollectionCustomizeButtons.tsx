import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import { BatchBadgeDetails, BatchBadgeDetailsArray, CustomPage, UintRangeArray } from 'bitbadgesjs-sdk';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { EmptyIcon } from '../common/Empty';
import IconButton from '../display/IconButton';
import { removeListFromPage, removeBadgeFromPage, addBadgeToPage } from '../../bitbadges-api/utils/customPageUtils';

const RemoveButton = ({ onClick }: { onClick: () => void }) => {
  return <IconButton secondary minWidth={30} src={<EyeInvisibleOutlined />} size={30} text={'Remove'} onClick={onClick} />;
};

export const ListCustomizeButtons = ({
  addressOrUsername,
  listId,
  showCustomizeButtons,
  isWatchlist,
  currPage
}: {
  addressOrUsername?: string;
  listId: string;
  showCustomizeButtons?: boolean;
  isWatchlist?: boolean;
  currPage?: string;
}) => {
  const accountInfo = useAccount(addressOrUsername);

  const OnPageSelect = ({ pageName, listId }: { pageName: string; listId: string }) => {
    if (!accountInfo) return <EmptyIcon />;

    return (
      <>
        <div className="flex-around full-width flex-wrap">
          <div style={{ fontSize: 12 }}>
            <RemoveButton
              onClick={async () => {
                await removeListFromPage(accountInfo, listId, pageName, isWatchlist ? 'watchlists' : 'customPages');

                notification.success({
                  message: 'This list has been removed from ' + pageName + '.',
                  description: 'A page refresh may be required to see the changes.'
                });
              }}
            />
          </div>
        </div>
      </>
    );
  };

  const isValidPageName =
    currPage === 'Hidden' ||
    (isWatchlist
      ? accountInfo?.watchlists?.lists.find((x) => x.title === currPage)
      : accountInfo?.customPages?.lists.find((x) => x.title === currPage));

  if (!isValidPageName) return <></>;

  return (
    <>
      {showCustomizeButtons && currPage && (
        <div className="">
          <OnPageSelect pageName={currPage} listId={listId.toString()} />
        </div>
      )}
    </>
  );
};

export const CustomizeButtons = ({
  addressOrUsername,
  badgeIdObj,
  badgeId,
  showCustomizeButtons,
  isWatchlist,
  currPage
}: {
  addressOrUsername?: string;
  badgeIdObj: BatchBadgeDetails<bigint>;
  badgeId: bigint;
  showCustomizeButtons?: boolean;
  isWatchlist?: boolean;
  currPage?: string;
}) => {
  const accountInfo = useAccount(addressOrUsername);

  const pages = isWatchlist ? accountInfo?.watchlists?.badges ?? [] : accountInfo?.customPages?.badges ?? [];

  const OnPageSelect = ({ pageName, badgeIdObj }: { pageName: string; badgeIdObj: BatchBadgeDetails<bigint> }) => {
    const isHidden = BatchBadgeDetailsArray.From({
      collectionId: badgeIdObj.collectionId,
      badgeIds: [{ start: badgeId, end: badgeId }]
    }).every((x) => x.isSubsetOf(accountInfo?.hiddenBadges ?? []));

    const isCollectionEntirelyHidden = BatchBadgeDetailsArray.From({
      collectionId: badgeIdObj.collectionId,
      badgeIds: UintRangeArray.FullRanges()
    }).every((x) => x.isSubsetOf(accountInfo?.hiddenBadges ?? []));

    const isCollectionNeverHidden = !accountInfo?.hiddenBadges?.some((x) => x.collectionId == badgeIdObj.collectionId && x.badgeIds.length > 0);

    //Just wrappers for the imported functions auto-adding badgeIdObj.collectionId
    //Should change these in future
    const isOnPage = (pageTitle: string, pages: Array<CustomPage<bigint>>) => {
      return BatchBadgeDetailsArray.From({
        collectionId: badgeIdObj.collectionId,
        badgeIds: [{ start: badgeId, end: badgeId }]
      }).every((x) => x.isSubsetOf(pages?.find((x) => x.title == pageTitle)?.items ?? []));
    };

    const isCollectionEntirelyOnPage = (pageTitle: string, pages: Array<CustomPage<bigint>>) => {
      return BatchBadgeDetailsArray.From({
        collectionId: badgeIdObj.collectionId,
        badgeIds: UintRangeArray.FullRanges()
      }).every((x) => x.isSubsetOf(pages?.find((x) => x.title == pageTitle)?.items ?? []));
    };

    const isCollectionNeverOnPage = !pages?.some(
      (x) => x.title === pageName && x.items.some((x) => x.collectionId == badgeIdObj.collectionId && x.badgeIds.length > 0)
    );

    const badgeOnPage = pageName == 'Hidden' ? isHidden : isOnPage(pageName, pages);
    const collectionOnPage = pageName == 'Hidden' ? isCollectionEntirelyHidden : isCollectionEntirelyOnPage(pageName, pages);
    const collectionNeverOnPage = pageName == 'Hidden' ? isCollectionNeverHidden : isCollectionNeverOnPage;

    if (!accountInfo) return <EmptyIcon />;

    return (
      <>
        <div className="flex-around full-width flex-wrap">
          <div style={{ fontSize: 12 }}>
            <b>Badge</b>
            <IconButton
              secondary
              minWidth={30}
              src={badgeOnPage ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              size={30}
              text={badgeOnPage ? 'Remove' : 'Add'}
              onClick={async () => {
                const currBadgeObj = new BatchBadgeDetails<bigint>({
                  collectionId: badgeIdObj.collectionId,
                  badgeIds: [{ start: badgeId, end: badgeId }]
                });
                if (badgeOnPage) {
                  await removeBadgeFromPage(accountInfo, currBadgeObj, pageName, isWatchlist ? 'watchlists' : 'customPages');
                } else {
                  await addBadgeToPage(accountInfo, currBadgeObj, pageName, isWatchlist ? 'watchlists' : 'customPages');
                }
                notification.success({
                  message: 'This badge will now be' + (!isHidden ? ' hidden' : ' shown') + ' for your profile.',
                  description: 'A page refresh may be required to see the changes.'
                });
              }}
            />
          </div>
          <div style={{ fontSize: 12 }}>
            <b>Collection</b>
            <div className="flex flex-wrap">
              {!collectionNeverOnPage && (
                <IconButton
                  secondary
                  minWidth={30}
                  src={<EyeInvisibleOutlined />}
                  size={30}
                  text={'Remove'}
                  tooltipMessage="Remove the entire collection from this page"
                  onClick={async () => {
                    const collectionObj = new BatchBadgeDetails<bigint>({
                      collectionId: badgeIdObj.collectionId,
                      badgeIds: UintRangeArray.FullRanges()
                    });
                    await removeBadgeFromPage(accountInfo, collectionObj, pageName, isWatchlist ? 'watchlists' : 'customPages');

                    notification.success({
                      message: 'This collection has been removed from ' + pageName + '.',
                      description: 'A page refresh may be required to see the changes.'
                    });
                  }}
                />
              )}
              {!collectionOnPage && (
                <IconButton
                  secondary
                  minWidth={30}
                  src={<EyeOutlined />}
                  size={30}
                  text={'Add'}
                  tooltipMessage="Add the entire collection to this page"
                  onClick={async () => {
                    const collectionObj = new BatchBadgeDetails<bigint>({
                      collectionId: badgeIdObj.collectionId,
                      badgeIds: UintRangeArray.FullRanges()
                    });
                    await addBadgeToPage(accountInfo, collectionObj, pageName, isWatchlist ? 'watchlists' : 'customPages');

                    notification.success({
                      message: 'This collection has been added to ' + pageName + '.',
                      description: 'A page refresh may be required to see the changes.'
                    });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {showCustomizeButtons && (
        <div className="">
          {accountInfo && (
            <>
              {currPage === 'Hidden' && (
                <div className="flex-center flex-column" style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <OnPageSelect pageName="Hidden" badgeIdObj={badgeIdObj} />
                </div>
              )}

              <div className="flex-center flex-wrap flex-column">
                {pages?.map((x, idx) => {
                  if (x.title !== currPage) return null;

                  return <OnPageSelect key={idx} pageName={x.title} badgeIdObj={badgeIdObj} />;
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
