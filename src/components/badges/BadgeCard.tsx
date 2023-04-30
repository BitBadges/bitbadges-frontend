import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Card, Spin, Tooltip } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { BadgeMetadata, BitBadgeCollection, getSupplyByBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../constants";

export function BadgeCard({
    metadata,
    size = 100,
    collection,
    hoverable,
    id,
    hideCollectionLink,
}: {
    id: number;
    metadata?: BadgeMetadata;
    collection: BitBadgeCollection;
    size?: number;
    hoverable?: boolean;
    hideCollectionLink?: boolean;
}) {
    const router = useRouter();

    //Calculate total, undistributed, claimable, and distributed supplys
    const totalSupply = getSupplyByBadgeId(id, collection.maxSupplys);
    const undistributedSupply = getSupplyByBadgeId(id, collection.unmintedSupplys);
    let claimableSupply = 0;
    for (const claim of collection.claims) {
        claimableSupply += getSupplyByBadgeId(id, claim.balances);
    }
    const distributedSupply = totalSupply - undistributedSupply - claimableSupply;

    if (!metadata) return <></>

    return (
        <>
            <Card
                style={{
                    width: 230,
                    margin: 8,
                    textAlign: 'center',
                    borderRadius: '8%',
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT,
                }}
                hoverable={hoverable ? hoverable : true}
                onClick={() => {
                    router.push(`/collections/${collection.collectionId}/${id}`);
                }}
                cover={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            color: PRIMARY_TEXT,
                        }}
                    >

                        <Avatar
                            style={{
                                verticalAlign: 'middle',
                                border: '3px solid',
                                borderColor: metadata?.color
                                    ? metadata.color
                                    : 'black',
                                marginTop: '1rem',
                                cursor: 'pointer',
                            }}
                            src={
                                metadata?.image
                                    ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                                    : <Spin size='large' />
                            }
                            size={size}
                            onError={() => {
                                return false;
                            }}
                        />
                    </div>
                }
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        color: PRIMARY_TEXT,
                    }}
                >
                    <Meta
                        title={<div>
                            <div
                                style={{
                                    fontSize: 20,
                                    color: PRIMARY_TEXT,
                                    fontWeight: 'bolder',
                                    whiteSpace: 'normal'
                                }}
                            >
                                {metadata?.name}
                            </div>
                            {!hideCollectionLink &&
                                <div
                                    style={{
                                        fontSize: 14,
                                        color: PRIMARY_TEXT,
                                        fontWeight: 'bolder',
                                        whiteSpace: 'normal'
                                    }}
                                    onClick={(e) => {
                                        router.push(`/collections/${collection.collectionId}`);
                                        e.stopPropagation();
                                    }}
                                >
                                    <a>
                                        {collection.collectionMetadata.name}
                                    </a>
                                </div>}
                        </div>
                        }
                        description={
                            <div
                                style={{
                                    color: SECONDARY_TEXT,
                                    // display: 'flex',
                                    alignItems: 'center',
                                    fontSize: 17,
                                    width: '100%',
                                    justifyContent: 'center',
                                }}
                            >
                                ID #{id} / {collection.nextBadgeId - 1}
                                {collection && collection.maxSupplys && <><br />
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <div>Supply: {totalSupply} 
                                        {collection.standard === 0 &&
                                        <Tooltip
                                            title={<>
                                                <>Unminted: {undistributedSupply}</>
                                                <br />
                                                <>Claimable: {claimableSupply}</>
                                                <br />
                                                <>Minted: {distributedSupply}</>
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
