import { Col, Row, Typography } from 'antd';
import { useRouter } from 'next/router';

import { BadgeAvatar } from './BadgeAvatar';
import { Metadata, getMetadataDetailsForBadgeId } from 'bitbadgesjs-utils';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';

const { Text } = Typography;

export function CollectionHeader({ collectionId, hideCollectionLink, badgeId, metadataOverride }: {
  collectionId: bigint;
  badgeId?: bigint;
  hideCollectionLink?: boolean;
  metadataOverride?: Metadata<bigint>
}) {
  const router = useRouter();

  const collection = useCollection(collectionId)
  const metadata = metadataOverride ? metadataOverride : badgeId ? getMetadataDetailsForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])?.metadata : collection?.cachedCollectionMetadata;
  const collectionMetadata = collection?.cachedCollectionMetadata;

  return <div className='dark:text-white'>
    <Row className='flex-center'>
      <Col span={12} className='flex-center'>
        <div className='flex-center flex-column'>
          <BadgeAvatar
            collectionId={collectionId}
            badgeId={badgeId}
            size={200}
            noHover
            metadataOverride={metadataOverride}
          />
          <div style={{ maxWidth: 500, textAlign: 'center' }}>
            <Text strong className='dark:text-white' style={{ fontSize: 30 }}>
              {metadata?.name}
            </Text>
            {!hideCollectionLink && <><br />
              <Text strong className='dark:text-white' style={{ fontSize: 16 }}>
                <a onClick={() => {
                  router.push(`/collections/${collectionId}`)
                }}>{collectionMetadata?.name}</a>
              </Text></>
            }
          </div>
        </div>
      </Col>
    </Row>
    <br />
  </div >
}
