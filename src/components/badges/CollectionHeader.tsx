import { Col, Row, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BadgeAvatar } from './BadgeAvatar';

const { Text } = Typography;

export function CollectionHeader({ collectionId }: {
  collectionId: bigint;
}) {
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const metadata = collection?.collectionMetadata;

  return <div className='primary-text'>
    <Row className='flex-center'>
      <Col span={12} className='flex-center'>
        <div className='flex-center flex-column'>
          <BadgeAvatar
            collectionId={collectionId}
            size={200}
          />
          <div style={{ maxWidth: 500 }}>
            <Text strong className='primary-text' style={{ fontSize: 30 }}>
              {metadata?.name}
            </Text>
            <br />
            <Text strong className='primary-text' style={{ fontSize: 16 }}>
              <a onClick={() => {
                router.push(`/collections/${collectionId}`)
              }}>{metadata?.name}</a>
            </Text>
          </div>
        </div>
      </Col>
    </Row>
    <br />
  </div >
}
