import { Card, Tooltip } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { DefaultPlaceholderMetadata, getBalanceForIdAndTime, getMetadataForBadgeId, isFullUintRanges } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Balance } from 'bitbadgesjs-proto';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { getTimeRangesString } from '../../utils/dates';
import { BadgeAvatar } from './BadgeAvatar';

export function BadgeCard({
  size = 75,
  collectionId,
  hoverable,
  badgeId,
  hideCollectionLink,
  showSupplys,
  balances
}: {
  badgeId: bigint;
  collectionId: bigint
  size?: number;
  hoverable?: boolean;
  hideCollectionLink?: boolean;
  showSupplys?: boolean;
  balances?: Balance<bigint>[]
}) {
  const router = useRouter();

  const collection = useCollection(collectionId)


  //Calculate total, undistributed, claimable, and distributed supplys

  const maxBadgeId = collection ? getTotalNumberOfBadges(collection) : 0n;
  const metadata = badgeId > maxBadgeId ? DefaultPlaceholderMetadata :
    getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []);

  const collectionMetadata = collection?.cachedCollectionMetadata;

  const currBalanceAmount = badgeId && balances ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), balances) : 0n;
  const showOwnershipTimesIcon = badgeId && balances && showSupplys ? balances.some(x => !isFullUintRanges(x.ownershipTimes)) : false;

  // <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 3xl:grid-cols-7">
  // </div>

  //cardWidth = screenWidth / 200 rounded down to nearest 10
  const expectedNumCards = Math.round(window.innerWidth / 200);
  const numCards = Math.max(2, expectedNumCards);
  const cardWidth = ((window.innerWidth - 100) / numCards)

  return (
    <div >
      <Card
        className='primary-text card-bg'
        style={{
          width: cardWidth,
          margin: 8,
          textAlign: 'center',
          borderRadius: '8%',
        }}
        hoverable={hoverable ? hoverable : true}
        onClick={() => {
          router.push(`/collections/${collectionId}/${badgeId}`);
        }}
        cover={
          <div className='flex-center full-width primary-text' style={{ marginTop: '1rem' }}>
            <BadgeAvatar
              collectionId={collectionId}
              badgeId={badgeId}
              size={size}
              noHover
            />
          </div>
        }
      >
        <div className='flex-center full-width primary-text'>
          <Meta
            title={<div>
              <div className='primary-text md:text-md lg:text-lg'
                style={{
                  fontWeight: 'bolder',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {metadata?.name}
              </div>
              {!hideCollectionLink &&
                <div
                  className='primary-text md:text-sm lg:text-md'
                  style={{
                    fontWeight: 'bolder',
                    whiteSpace: 'normal'
                  }}
                  onClick={(e) => {
                    router.push(`/collections/${collectionId}`);
                    e.stopPropagation();
                  }}
                >
                  <a>
                    {collectionMetadata?.name}
                  </a>
                </div>}
            </div>
            }
            description={
              <div
                className='secondary-text full-width'
                style={{
                  alignItems: 'center',
                  fontSize: 17,
                  justifyContent: 'center',
                }}
              >

                {collection && <>
                  ID #{`${badgeId}`}
                  <br />
                </>}
                {showSupplys && <>
                  x<span style={{ color: currBalanceAmount < 0 ? 'red' : undefined }}>
                    {`${currBalanceAmount}`}
                  </span></>}
                {showOwnershipTimesIcon && showSupplys &&
                  <Tooltip color='black' title={
                    <div>
                      {
                        balances?.map((x, idx) => {
                          return <>
                            {idx > 0 && <br />}

                            {idx > 0 && <br />}

                            x{x.amount.toString()} from {getTimeRangesString(x.ownershipTimes, '', true)}

                          </>
                        })
                      }
                    </div>
                  }>
                    <ClockCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                }
                {showSupplys && <>{' '}owned</>}
              </div>
            }
          />
        </div>
      </Card>
    </div>
  );
}
