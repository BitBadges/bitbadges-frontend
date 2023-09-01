import { Col, Row, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BadgeAvatar } from './BadgeAvatar';
import { Metadata, getMetadataDetailsForBadgeId } from 'bitbadgesjs-utils';

const { Text } = Typography;

export function CollectionHeader({ collectionId, hideCollectionLink, badgeId, metadataOverride }: {
  collectionId: bigint;
  badgeId?: bigint;
  hideCollectionLink?: boolean;
  metadataOverride?: Metadata<bigint>
}) {
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]
  const metadata = metadataOverride ? metadataOverride : badgeId ? getMetadataDetailsForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])?.metadata : collection?.cachedCollectionMetadata;
  const collectionMetadata = collection?.cachedCollectionMetadata;

  return <div className='primary-text'>
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
            <Text strong className='primary-text' style={{ fontSize: 30 }}>
              {metadata?.name}
            </Text>
            {!hideCollectionLink && <><br />
              <Text strong className='primary-text' style={{ fontSize: 16 }}>
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
