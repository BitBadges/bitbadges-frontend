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
import { BitBadge, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';

const { Text } = Typography;

export function BadgeHeader({ conceptBadge, badge, hidePermissions }: {
    conceptBadge?: boolean;
    badge: BitBadgeCollection | undefined;
    hidePermissions?: boolean;
    balanceInfo?: UserBalance;
}) {
    if (!badge) return <></>

    console.log("Loading BadgeHeader for The Following Badge: ", badge);

    let endTimestamp = MAX_DATE_TIMESTAMP;
    let validForever = true;
    if (badge.metadata?.validFrom?.end) {
        endTimestamp = badge.metadata.validFrom.end;
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
            {conceptBadge && (
                <Alert
                    style={{ textAlign: 'center' }}
                    message="Warning: This badge is a concept badge and is not currently on the blockchain."
                    description="Concept badges are created by users to showcase a badge they plan to create in the future. There may be differences between the conceptual version and the final on-chain version."
                    type="warning"
                    closable
                />
            )}
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
                        borderColor: badge.metadata?.color
                            ? badge.metadata?.color
                            : 'black',
                        margin: 4,
                        backgroundColor: badge.metadata?.image
                            ? PRIMARY_TEXT
                            : badge.metadata?.color,
                    }}
                    // className="badge-avatar"   //For scaling on hover
                    src={
                        badge.metadata?.image ? badge.metadata?.image : undefined
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
                    {badge.metadata?.name}
                </Text>
            </div>
        </div>
    );
}
