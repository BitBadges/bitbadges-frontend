import Meta from 'antd/lib/card/Meta';
import { Avatar, Card } from 'antd';
import React from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../constants';
import { BitBadge, BitBadgeCollection } from '../bitbadges-api/types';
import { useRouter } from 'next/router';

export function BadgeCard({
    badge,
    size,
    collection,
    hoverable,
}: {
    badge?: BitBadge;
    collection?: BitBadgeCollection;
    size?: number;
    hoverable?: boolean;
}) {
    const router = useRouter();

    if (!badge) return <></>;

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
                    router.push(`/badges/${collection?.id}/${badge.badgeId}`);
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
                                borderColor: badge.metadata?.color
                                    ? badge.metadata.color
                                    : 'black',
                                marginTop: '1rem',
                                cursor: 'pointer',
                                backgroundColor: badge.metadata?.image
                                    ? PRIMARY_TEXT
                                    : (badge.metadata?.color
                                        ? badge.metadata.color
                                        : 'black'),
                            }}
                            // className="badge-avatar"   //For scaling on hover
                            src={
                                badge.metadata?.image
                                    ? badge.metadata.image
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
                                {badge.metadata?.name}
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
                                ID #: {badge.badgeId}
                                <br />
                                Supply: {badge.totalSupply}
                                <br />
                                {badge.metadata?.description}
                            </div>
                        }
                    />
                </div>
            </Card>
        </>
    );
}
