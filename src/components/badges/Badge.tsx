import Meta from 'antd/lib/card/Meta';
import { Avatar, Tooltip, Card } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSnowflake,
    faGlobe,
    faWallet,
    faCloud,
    faSquareMinus,
    faSquarePlus,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import React from 'react';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';

// import { signAndSubmitPrivateApiTxn } from '../api/api';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { BitBadge, BitBadgeCollection } from '../../bitbadges-api/types';
import { useRouter } from 'next/router';

export function Badge({
    badge,
    size,
    collection,
    // collectedBadge,
    managing,
    hideModal,
    hack
}: {
    badge?: BitBadge;
    collection?: BitBadgeCollection;
    size?: number;
    // collectedBadge?: boolean;
    managing?: boolean;
    hideModal?: boolean;
    hack?: boolean;
}) {
    const [modalIsVisible, setModalIsVisible] = useState(false);
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
                hoverable
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
