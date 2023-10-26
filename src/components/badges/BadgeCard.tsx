import { Card } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
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
  const collection = collections.getCollection(collectionId)


  //Calculate total, undistributed, claimable, and distributed supplys
  const metadata = getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []);
  const collectionMetadata = collection?.cachedCollectionMetadata;
  const maxBadgeId = collection ? getTotalNumberOfBadges(collection) : 0n;



  return (
    <div>
      <Card
        className='dark:text-white gradient-bg'
        style={{
          width: 200,
          margin: 8,
          textAlign: 'center',
          borderRadius: '8%',
          // background: 'linear-gradient(0deg, black 10%, #001529 100%)'
        }}
        hoverable={hoverable ? hoverable : true}
        onClick={() => {
          router.push(`/collections/${collectionId}/${badgeId}`);
        }}
        cover={
          <div className='flex-center full-width dark:text-white' style={{ marginTop: '1rem' }}>
            <BadgeAvatar
              collectionId={collectionId}
              badgeId={badgeId}
              size={size}
              noHover
            />
          </div>
        }
      >
        <div className='flex-center full-width dark:text-white'>
          <Meta
            title={<div>
              <div className='dark:text-white'
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
                  className='dark:text-white'
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
                className='text-gray-400 full-width'
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
    </div>
  );
}
