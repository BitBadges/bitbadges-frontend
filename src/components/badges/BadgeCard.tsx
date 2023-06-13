import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Tooltip } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { getBalanceForId, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BadgeAvatar } from './BadgeAvatar';

export function BadgeCard({
  size = 100,
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
  const collection = collections.getCollection(collectionId);


  //Calculate total, undistributed, claimable, and distributed supplys
  const totalSupply = collection ? getBalanceForId(badgeId, collection.maxSupplys) : 0n;
  const undistributedSupply = collection ? getBalanceForId(badgeId, collection.unmintedSupplys) : 0n;
  const distributedSupply = totalSupply - undistributedSupply;

  const metadata = getMetadataForBadgeId(badgeId, collection?.badgeMetadata ?? []);
  const collectionMetadata = collection?.collectionMetadata;

  const isOffChainBalances = collection && collection.balancesUri ? true : false;

  return (
    <>
      <Card
        className='primary-text primary-blue-bg'
        style={{
          width: 230,
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
                  whiteSpace: 'normal'
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
                  ID #{`${badgeId}`} / {`${collection.nextBadgeId - 1n}`}
                  <br />
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
                  </div>
                </>}
              </div>
            }
          />
        </div>
      </Card>
    </>
  );
}
