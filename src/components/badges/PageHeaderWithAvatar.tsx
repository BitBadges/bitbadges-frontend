import { Avatar, Typography } from 'antd';
import React from 'react';
import { PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection } from '../../bitbadges-api/types';

const { Text } = Typography;

export function PageHeaderWithAvatar({ badge, metadata }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
}) {
    if (!badge || !metadata) return <></>;

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
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
                        backgroundColor: metadata?.image
                            ? PRIMARY_TEXT
                            : metadata?.color,
                    }}
                    // className="badge-avatar"   //For scaling on hover
                    src={
                        metadata?.image ? metadata?.image : undefined
                    }
                    size={200}
                    onError={() => {
                        return false;
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Text strong style={{ fontSize: 30, color: PRIMARY_TEXT }}>
                    {metadata?.name}
                </Text>
            </div>
        </div>
    );
}
