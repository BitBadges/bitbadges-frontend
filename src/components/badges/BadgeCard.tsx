import { Card, Tooltip, notification } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { BalanceArray, BatchBadgeDetails, Metadata, getBalanceForIdAndTime } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';

import { ClockCircleOutlined } from '@ant-design/icons';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTimeRangesString } from '../../utils/dates';
import { BadgeAvatar } from './BadgeAvatar';
import { CustomizeButtons } from './MultiCollectionCustomizeButtons';

export function BadgeCard({
  size = 100,
  collectionId,
  hoverable,
  badgeId,
  hideCollectionLink,
  showSupplys,
  balances,
  groupedByCollection,
  showCustomizeButtons,
  isWatchlist,
  addressOrUsername,
  currPageName
}: {
  badgeId: bigint;
  collectionId: bigint;
  size?: number;
  hoverable?: boolean;
  hideCollectionLink?: boolean;
  showSupplys?: boolean;
  balances?: BalanceArray<bigint>;
  groupedByCollection?: boolean;
  showCustomizeButtons?: boolean;
  isWatchlist?: boolean;
  addressOrUsername?: string;
  currPageName?: string;
}) {
  const router = useRouter();

  const collection = useCollection(collectionId);
  //Calculate total, undistributed, claimable, and distributed supplys

  const maxBadgeId = collection ? collection.getMaxBadgeId() : 0n;
  const metadata = badgeId > maxBadgeId ? Metadata.DefaultPlaceholderMetadata() : collection?.getBadgeMetadata(badgeId);

  const collectionMetadata = collection?.cachedCollectionMetadata;
  const currBalanceAmount = badgeId && balances ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), balances.filterZeroBalances()) : 0n;
  const showOwnershipTimesIcon = badgeId && balances && showSupplys ? balances.some((x) => !x.ownershipTimes.isFull()) : false;

  const isMobile = window.innerWidth < 768;
  const oneVW = window.innerWidth / 100;
  const withinCard = isMobile ? 32 : 0;
  const maxWidth = isMobile ? (window.innerWidth - 32 - 4 * (oneVW * 4) - withinCard) / 2 : 200;

  return (
    <Card
      className="primary-text card-bg card-border rounded-lg"
      style={{
        margin: 8,
        textAlign: 'center',

        //we want 2 per row so calc padding based on that (3vw margin, 1vw padding) + 8px margin either side of card
        maxWidth: !groupedByCollection ? maxWidth : 200,
        width: isMobile && !groupedByCollection ? maxWidth : 200
      }}
      hoverable={hoverable ? hoverable : true}
      bodyStyle={{ padding: 8 }}
      onClick={() => {
        if (collectionId == NEW_COLLECTION_ID) {
          notification.info({
            message: 'Navigating to a preview badge is not supported.',
            description: 'You will be able to see a preview of the pages on the last step of this form.'
          });
          return;
        }
        router.push(`/collections/${collectionId}/${badgeId}`);
      }}
      cover={
        <div className="flex-center full-width primary-text" style={{ marginTop: '1rem' }}>
          <BadgeAvatar collectionId={collectionId} badgeId={badgeId} size={size} noHover />
        </div>
      }
    >
      <div className="flex-center full-width primary-text">
        <Meta
          title={
            <div>
              <div
                className="primary-text xs:text-xs sm:text-sm md:text-md lg:text-lg"
                style={{
                  fontWeight: 'bolder',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {metadata?.name}
              </div>
              {!hideCollectionLink && (
                <div
                  className="primary-text"
                  style={{
                    fontWeight: 'bolder',
                    fontSize: 14,
                    whiteSpace: 'normal'
                  }}
                  onClick={(e) => {
                    if (collectionId == NEW_COLLECTION_ID) {
                      notification.info({
                        message: 'Navigating to a preview collection is not supported.',
                        description: 'You will be able to see a preview of the pages on the last step of this form.'
                      });
                      return;
                    }
                    router.push(`/collections/${collectionId}`);
                    e.stopPropagation();
                  }}
                >
                  <a className="">{collectionMetadata?.name}</a>
                </div>
              )}
            </div>
          }
          description={
            <div
              className="secondary-text full-width xs:text-xs sm:text-sm md:text-md lg:text-lg"
              style={{
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {collection && (
                <>
                  ID #{`${badgeId}`}
                  <br />
                </>
              )}
              {showSupplys && (
                <>
                  x
                  <span
                    style={{
                      color: currBalanceAmount < 0 ? 'red' : undefined
                    }}
                  >
                    {`${currBalanceAmount}`}
                  </span>
                </>
              )}
              {showOwnershipTimesIcon && showSupplys && (
                <Tooltip
                  color="black"
                  title={
                    <div>
                      {balances?.map((x, idx) => {
                        return (
                          <>
                            {idx > 0 && <br />}
                            {idx > 0 && <br />}x{x.amount.toString()} from {getTimeRangesString(x.ownershipTimes, '', true)}
                          </>
                        );
                      })}
                    </div>
                  }
                >
                  <ClockCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              )}
              {showSupplys && <> owned</>}
              <div className="my-3" />
              {showCustomizeButtons && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex-center full-width primary-text">
                    <CustomizeButtons
                      badgeIdObj={
                        new BatchBadgeDetails({
                          collectionId: collectionId,
                          badgeIds: [{ start: badgeId, end: badgeId }]
                        })
                      }
                      badgeId={badgeId}
                      showCustomizeButtons={showCustomizeButtons}
                      addressOrUsername={addressOrUsername}
                      isWatchlist={isWatchlist}
                      currPage={currPageName}
                    />
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>
    </Card>
  );
}
