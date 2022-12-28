import { Avatar, Typography } from 'antd';
import React, { useState } from 'react';
import { PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { BellOutlined, SwapOutlined, SettingOutlined } from '@ant-design/icons';
import { ButtonDisplay } from '../ButtonDisplay';
import { CreateTxMsgTransferBadgeModal } from '../txModals/CreateTxMsgTransferBadge';
import { useChainContext } from '../../chain/ChainContext';

const { Text } = Typography;

export function PageHeaderWithAvatar({ badge, metadata, balance }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);

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
                // {
                //     name: 'Pending',
                //     icon: <BellOutlined />,
                //     onClick: () => { },
                // },
                {
                    name: 'Swap',
                    icon: <SwapOutlined />,
                    onClick: () => { setTransferIsVisible(true) },
                    tooltipMessage: !chain.connected ? 'No connected wallet.' : 'Transfer this badge to another address',
                    disabled: !chain.connected
                },
                // {
                //     name: 'Customize',
                //     icon: <SettingOutlined />,
                //     onClick: () => { },
                // },
            ]} />
        </div>
        <CreateTxMsgTransferBadgeModal
            badge={badge}
            visible={transferIsVisible}
            setVisible={setTransferIsVisible}
            balance={balance ? balance : {} as UserBalance}
        />
    </>
    );
}
