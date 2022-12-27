import Meta from 'antd/lib/card/Meta';
import { Avatar, Card } from 'antd';
import React from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../constants';
import { BadgeMetadata, BitBadgeCollection } from '../bitbadges-api/types';
import { useRouter } from 'next/router';

//Can probably add this to bitbadges-js
const getSupplyByBadgeId = (badgeCollection: BitBadgeCollection, badgeId: number) => {
    let supply = badgeCollection.subassetSupplys.find((subassetSupply) => {

        return subassetSupply.idRanges.find((idRange) => {
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
    id
}: {
    id: number;
    metadata?: BadgeMetadata;
    collection: BitBadgeCollection;
    size?: number;
    hoverable?: boolean;
}) {
    const router = useRouter();

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
                    router.push(`/badges/${collection?.id}/${id}`);
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
                                <br />
                                Supply: {getSupplyByBadgeId(collection, id)}
                                <br />
                                {metadata?.description}
                            </div>
                        }
                    />
                </div>
            </Card>
        </>
    );
}
