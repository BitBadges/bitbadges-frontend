import { Card } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BadgeAvatar } from './BadgeAvatar';

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
  const totalSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
  const metadata = getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []);
  const collectionMetadata = collection?.cachedCollectionMetadata;



  let maxBadgeId = 0n;
  for (const balance of totalSupplyBalance) {
    for (const badgeIdRange of balance.badgeIds) {
      if (badgeIdRange.end > maxBadgeId) {
        maxBadgeId = badgeIdRange.end;
      }
    }
  }


  return (
    <>
      {/* <Col md={6} sm={24} xs={24} className='flex-center' style={{ padding: 0 }}> */}
      <Card
        className='primary-text primary-blue-bg'
        style={{
          minWidth: 240,
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
                  {/* <br />
                  <div className='flex-center'>
                    <div>Supply: {totalSupply.toString()}
                      {isOffChainBalances &&
                        <Tooltip
                          title={<>
                            <>Unminted: {undistributedSupply}</>
                            <br />
                            <>Minted + Claimable: {distributedSupply}</>
                          </>}
                          placement='bottom'>
                          <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>}
                    </div>
                  </div> */}
                </>}
              </div>
            }
          />
        </div>
      </Card>
      {/* </Col> */}
    </>
  );
}
