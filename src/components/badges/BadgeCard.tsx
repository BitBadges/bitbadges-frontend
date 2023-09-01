import { Card } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BadgeAvatar } from './BadgeAvatar';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';

export function BadgeCard({
  size = 75,
  collectionId,
  hoverable,
  badgeId,
  hideCollectionLink,
}: {
  badgeId: bigint;
  collectionId: bigint
  size?: number;
  hoverable?: boolean;
  hideCollectionLink?: boolean;
}) {
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]


  //Calculate total, undistributed, claimable, and distributed supplys
  const metadata = getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []);
  const collectionMetadata = collection?.cachedCollectionMetadata;
  const maxBadgeId = collection ? getTotalNumberOfBadges(collection) : 0n;



  return (
    <>
      <Card
        className='primary-text primary-blue-bg'
        style={{
          minWidth: 200,
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
              <div className='primary-text'
                style={{
                  fontSize: 20,
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
                  className='primary-text'
                  style={{
                    fontSize: 14,
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
                  ID #{`${badgeId}`} / {`${maxBadgeId}`}
                </>}
              </div>
            }
          />
        </div>
      </Card>
    </>
  );
}
