import { Avatar, Typography } from 'antd';
import React, { useState } from 'react';
import { PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { BellOutlined, SwapOutlined, SettingOutlined, SwapRightOutlined, SwapLeftOutlined } from '@ant-design/icons';
import { ButtonDisplay } from '../ButtonDisplay';
import { CreateTxMsgTransferBadgeModal } from '../txModals/CreateTxMsgTransferBadge';
import { useChainContext } from '../../chain/ChainContext';
import { CreateTxMsgRequestTransferBadgeModal } from '../txModals/CreateTxMsgRequestTransferBadgeModal';
import { Pending } from '../old/PendingModal';
import { CreateTxMsgHandlePendingTransferModal } from '../txModals/CreateTxMsgHandlePendingTransferModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonCircleQuestion } from '@fortawesome/free-solid-svg-icons';

const { Text } = Typography;

export function PageHeaderWithAvatar({ badge, metadata, balance }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);
    const [requestTransferIsVisible, setRequestTransferIsVisible] = useState<boolean>(false);
    const [pendingIsVisible, setPendingIsVisible] = useState<boolean>(false);

    if (!badge || !metadata) return <></>;

    return (<>
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
            <ButtonDisplay buttons={[
                {
                    name: 'Pending',
                    icon: <BellOutlined />,
                    tooltipMessage: !chain.connected ? 'No connected wallet.' : 'See your pending requests and transfers for this badge.',
                    onClick: () => { setPendingIsVisible(true) },
                    disabled: !chain.connected,
                    count: balance?.pending?.length
                },
                {
                    name: 'Transfer',
                    icon: <SwapOutlined />,
                    onClick: () => { setTransferIsVisible(true) },
                    tooltipMessage: !chain.connected ? 'No connected wallet.' : 'Transfer this badge to another address',
                    disabled: !chain.connected
                },
                {
                    name: 'Request',
                    icon: <FontAwesomeIcon icon={faPersonCircleQuestion} />,
                    onClick: () => { setRequestTransferIsVisible(true) },
                    tooltipMessage: !chain.connected ? 'No connected wallet.' : 'Request this badge to be transferred to you!',
                    disabled: !chain.connected
                },
            ]} />
        </div>

        <CreateTxMsgTransferBadgeModal
            badge={badge}
            visible={transferIsVisible}
            setVisible={setTransferIsVisible}
            balance={balance ? balance : {} as UserBalance}
        />

        <CreateTxMsgRequestTransferBadgeModal
            badge={badge}
            visible={requestTransferIsVisible}
            setVisible={setRequestTransferIsVisible}
            balance={balance ? balance : {} as UserBalance}
        />

        <CreateTxMsgHandlePendingTransferModal
            badge={badge}
            visible={pendingIsVisible}
            setVisible={setPendingIsVisible}
            balance={balance ? balance : {} as UserBalance}
        />
    </>
    );
}
