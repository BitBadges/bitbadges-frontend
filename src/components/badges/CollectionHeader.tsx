import { Avatar, Col, Row, Spin, Typography } from 'antd';
import { BadgeMetadata, BitBadgeCollection } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { PRIMARY_TEXT } from '../../constants';

const { Text } = Typography;

export function CollectionHeader({ metadata, collection }: {
  metadata: BadgeMetadata;
  collection?: BitBadgeCollection;
}) {
  const router = useRouter();

  return <>
    <div style={{
      color: PRIMARY_TEXT,
    }}>
      <Row
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Col span={12}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <Avatar
              style={{
                verticalAlign: 'middle',
                border: '3px solid',
                borderColor: metadata?.color
                  ? metadata?.color
                  : 'black',
                margin: 4,
              }}
              src={
                metadata?.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : <Spin />
              }
              size={200}
              onError={() => {
                return false;
              }}
            />

            {<div style={{ maxWidth: 500 }}>

              <Text strong style={{ fontSize: 30, color: PRIMARY_TEXT }}>
                {metadata?.name}
              </Text>
              {collection && <>
                <br />
                <Text strong style={{ fontSize: 16, color: PRIMARY_TEXT }}>
                  <a onClick={() => {
                    router.push(`/collections/${collection.collectionId}`)
                  }}>{collection.collectionMetadata?.name}</a>
                </Text>
              </>}
            </div>}
          </div>
        </Col>
      </Row>
      <br />
    </div>
  </>;
}
