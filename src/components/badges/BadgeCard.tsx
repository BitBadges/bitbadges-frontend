import { Avatar, Card, Spin } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { BadgeMetadata, BitBadgeCollection, UserBalance, getBlankBalance, getSupplyByBadgeId } from 'bitbadges-sdk';
import { useEffect, useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../constants";
import { BadgeModal } from './BadgeModal';

export function BadgeCard({
    metadata,
    size = 100,
    collection,
    hoverable,
    id,
    balance,
    userBalance,
    isModalOpen,

    setBadgeId,
    hideModalBalances
}: {
    id: number;
    metadata?: BadgeMetadata;
    collection: BitBadgeCollection;
    size?: number;
    hoverable?: boolean;
    balance?: UserBalance;
    userBalance?: UserBalance;
    isModalOpen?: boolean;
    setBadgeId?: (id: number) => void;
    hideModalBalances?: boolean;
}) {
    const [visible, setVisible] = useState<boolean>(isModalOpen ? isModalOpen : false);

    //Handle open exact badgeId modal if specified in URL params
    useEffect(() => {
        if (isModalOpen && !visible && setBadgeId) {
            setBadgeId(-1);
        }
    }, [isModalOpen, visible, setBadgeId]);

    //Calculate total, undistributed, claimable, and distributed supplys
    // const totalSupply = getSupplyByBadgeId(id, collection.maxSupplys);
    // const undistributedSupply = getSupplyByBadgeId(id, collection.unmintedSupplys);
    // let claimableSupply = 0;
    // for (const claim of collection.claims) {
    //     claimableSupply += getSupplyByBadgeId(id, claim.balances);
    // }
    // const distributedSupply = totalSupply - undistributedSupply - claimableSupply;

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
                    setVisible(true);
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
                            <div
                                style={{
                                    fontSize: 14,
                                    color: PRIMARY_TEXT,
                                    fontWeight: 'bolder',
                                    whiteSpace: 'normal'
                                }}
                            >
                                {collection.collectionMetadata.name}
                            </div>
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
                                {collection && balance && <><br />
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bolder',
                                        fontSize: 20
                                    }}>
                                        x{balance && getSupplyByBadgeId(id, balance.balances)} Owned
                                    </div>
                                </>}
                            </div>
                        }
                    />
                </div>
            </Card>

            <BadgeModal
                collection={collection}
                metadata={metadata}
                visible={visible}
                setVisible={setVisible}
                balance={userBalance ? userBalance : getBlankBalance()}
                badgeId={id}
                hideBalances={hideModalBalances}
            />
        </>

    );
}
