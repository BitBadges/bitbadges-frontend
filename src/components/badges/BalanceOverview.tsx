import { Typography } from 'antd';
import React, { useState } from 'react';
import {
    BellOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { ButtonDisplay } from '../common/ButtonDisplay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { CreateTxMsgTransferBadgeModal } from '../txModals/CreateTxMsgTransferBadge';
import { CreateTxMsgRequestTransferBadgeModal } from '../txModals/CreateTxMsgRequestTransferBadgeModal';
import { CreateTxMsgHandlePendingTransferModal } from '../txModals/CreateTxMsgHandlePendingTransferModal';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { TableRow } from '../common/TableRow';
import { InformationDisplayCard } from '../common/InformationDisplayCard';
import { BadgeAvatarDisplay } from './BadgeAvatarDisplay';

const { Text } = Typography;

export function BalanceOverview({ badge, metadata, balance, span }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
    span?: number;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);
    const [requestTransferIsVisible, setRequestTransferIsVisible] = useState<boolean>(false);
    const [pendingIsVisible, setPendingIsVisible] = useState<boolean>(false);

    if (!badge || !metadata) return <></>

    return (<>
        <InformationDisplayCard
            title={'Your Badges'}
            span={span}
        >
            {
                chain.connected && <>
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
                </>
            }
            {
                !chain.connected && <BlockinDisplay hideLogo={true} />
            }
            {
                balance?.balanceAmounts?.length === 0 &&
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <Text style={{ fontSize: 16, color: PRIMARY_TEXT }}>
                        You do not own any badge in this collection.
                    </Text>
                </div>
            }
            {balance?.balanceAmounts?.map((balanceAmount) => {
                return balanceAmount.idRanges.map((idRange) => {
                    let start = Number(idRange.start);
                    if (!idRange.end) idRange.end = idRange.start;
                    let end = Number(idRange.end);

                    return <TableRow key={start} label={'x' + balanceAmount.balance + ` (IDs: ${start}-${end})`} value={
                        <BadgeAvatarDisplay badgeCollection={badge} startId={start} endId={end} userBalance={balance} />
                    } labelSpan={8} valueSpan={16} />
                })
            })}
        </InformationDisplayCard>

        <CreateTxMsgTransferBadgeModal
            badge={badge ? badge : {} as BitBadgeCollection}
            visible={transferIsVisible}
            setVisible={setTransferIsVisible}
            balance={balance ? balance : {} as UserBalance}
        />

        <CreateTxMsgRequestTransferBadgeModal
            badge={badge ? badge : {} as BitBadgeCollection}
            visible={requestTransferIsVisible}
            setVisible={setRequestTransferIsVisible}
            balance={balance ? balance : {} as UserBalance}
        />

        <CreateTxMsgHandlePendingTransferModal
            badge={badge ? badge : {} as BitBadgeCollection}
            visible={pendingIsVisible}
            setVisible={setPendingIsVisible}
            balance={balance ? balance : {} as UserBalance}
        />
    </>
    );
}
