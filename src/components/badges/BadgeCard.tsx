import Meta from 'antd/lib/card/Meta';
import { Avatar, Card } from 'antd';
import React, { useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { BadgeMetadata, Balance, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { BadgeModal } from './BadgeModal';

//Can probably add this to bitbadges-js
const getSupplyByBadgeId = (badgeId: number, supplys: Balance[]) => {
    let supply = supplys.find((supply) => {
        return supply.badgeIds.find((idRange) => {
            if (idRange.start === undefined || idRange.end === undefined) {
                return false;
            }
            return badgeId >= idRange.start && badgeId <= idRange.end;
        });
    });

    return supply?.balance ?? 0;
}


export function BadgeCard({
    metadata,
    size,
    collection,
    hoverable,
    id,
    balance,
}: {
    id: number;
    metadata?: BadgeMetadata;
    collection: BitBadgeCollection;
    size?: number;
    hoverable?: boolean;
    balance?: UserBalance;
}) {
    const [visible, setVisible] = useState<boolean>(false);

    if (!metadata) return <></>;

    if (!size) size = 100;

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
                                backgroundColor: metadata?.image
                                    ? PRIMARY_TEXT
                                    : (metadata?.color
                                        ? metadata.color
                                        : 'black'),
                            }}
                            // className="metadata-avatar"   //For scaling on hover
                            src={
                                metadata?.image
                                    ? metadata.image
                                    : undefined
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
                                }}
                            >
                                {metadata?.name}
                            </div>
                        }
                        description={
                            <div
                                style={{
                                    color: SECONDARY_TEXT,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: 17,
                                    width: '100%',
                                    justifyContent: 'center',

                                }}
                            >
                                ID #: {id}
                                {collection && collection.maxSupplys && <><br />
                                    <div>Supply: {getSupplyByBadgeId(id, collection.maxSupplys)}</div>
                                    <div>Unminted Supply: {getSupplyByBadgeId(id, collection.unmintedSupplys)}</div>
                                </>
                                }
                                {balance && <><br />
                                    You own x{balance?.balances.find((balanceAmount) => {
                                        const found = balanceAmount.badgeIds.find((idRange) => {
                                            if (idRange.end === undefined) {
                                                idRange.end = idRange.start;
                                            }
                                            return id >= idRange.start && id <= idRange.end;
                                        });
                                        return found !== undefined;
                                    })?.balance ?? 0}</>}

                                {/* {metadata?.description} */}
                            </div>
                        }
                    />
                </div>
            </Card>

            <BadgeModal
                badge={collection}
                metadata={metadata}
                visible={visible}
                setVisible={setVisible}
                balance={balance ? balance : {} as UserBalance}
                badgeId={id}
            />
        </>

    );
}
