import { Address } from '../Address';
import { Avatar, Tooltip, Divider, Alert, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake, faUserLock } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import {
    SwapOutlined,
    CheckCircleFilled,
    WarningFilled,
    LockFilled,
    UnlockFilled,
    RollbackOutlined,
} from '@ant-design/icons';
import { MAX_DATE_TIMESTAMP, PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadge, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';

const { Text } = Typography;

export function BadgeHeader({ badge, metadata }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
}) {
    if (!badge || !metadata) return <></>

    console.log("Loading BadgeHeader for The Following Badge: ", badge);

    let endTimestamp = MAX_DATE_TIMESTAMP;
    let validForever = true;
    if (metadata?.validFrom?.end) {
        endTimestamp = metadata.validFrom.end;
        validForever = false;
    }

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp
    ).toLocaleDateString();

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
