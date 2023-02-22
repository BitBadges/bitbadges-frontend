import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Card, Spin, Tooltip } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { useEffect, useState } from 'react';
import { getBlankBalance, getSupplyByBadgeId } from '../../bitbadges-api/balances';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { BadgeModal } from './BadgeModal';

export function BadgeCard({
    metadata,
    size,
    collection,
    hoverable,
    id,
    balance,
    isModalOpen,
    setBadgeId
}: {
    id: number;
    metadata?: BadgeMetadata;
    collection: BitBadgeCollection;
    size?: number;
    hoverable?: boolean;
    balance?: UserBalance;
    isModalOpen?: boolean;
    setBadgeId?: (id: number) => void;
}) {
    const [visible, setVisible] = useState<boolean>(isModalOpen ? isModalOpen : false);

    //Handle open exact badgeId modal w/in URL params
    useEffect(() => {
        if (isModalOpen && !visible && setBadgeId) {
            setBadgeId(-1);
        }
    }, [isModalOpen, visible, setBadgeId]);

    if (!size) size = 100;

    let totalSupply = getSupplyByBadgeId(id, collection.maxSupplys);
    let undistributedSupply = getSupplyByBadgeId(id, collection.unmintedSupplys);

    let claimableSupply = 0;
    for (const claim of collection.claims) {
        claimableSupply += getSupplyByBadgeId(id, claim.balances);
    }
    let distributedSupply = totalSupply - undistributedSupply - claimableSupply;

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
                                    ? metadata.image
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
                        title={
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
                                ID: {id}
                                {collection && collection.maxSupplys && <><br />
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <div>Total Supply: {totalSupply} <Tooltip
                                            title={<>
                                                <>Unminted: {undistributedSupply}</>
                                                <br />
                                                <>Claimable: {claimableSupply}</>
                                                <br />
                                                <>Minted: {distributedSupply}</>
                                            </>}
                                            placement='bottom'>
                                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip></div>

                                    </div>
                                </>
                                }
                                {balance && <><br />
                                    You own x{getSupplyByBadgeId(id, balance.balances)}
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
                balance={balance ? balance : getBlankBalance()}
                badgeId={id}
            />
        </>

    );
}
