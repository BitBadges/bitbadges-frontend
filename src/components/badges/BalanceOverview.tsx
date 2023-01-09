import { Typography } from 'antd';
import React, { useState } from 'react';
import {
    BellOutlined,
    LockOutlined,
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

export function BalanceOverview({ badge, setBadge, metadata, balance, span }: {
    badge: BitBadgeCollection | undefined;
    setBadge: (badge: BitBadgeCollection) => void;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
    span?: number;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);
    const [requestTransferIsVisible, setRequestTransferIsVisible] = useState<boolean>(false);
    const [pendingIsVisible, setPendingIsVisible] = useState<boolean>(false);

    if (!badge || !metadata) return <></>;

    const accountIsInFreezeRanges = chain.accountNumber ? badge?.freezeRanges.some(range => {
        return range.start <= chain.accountNumber && range.end >= chain.accountNumber;
    }) : false;
    const accountIsFrozen = (badge.permissions.FrozenByDefault && !accountIsInFreezeRanges) || (!badge.permissions.FrozenByDefault && accountIsInFreezeRanges);
    const accountIsNotPermanantlyFrozenButBadgeIsNonTransferable = accountIsFrozen && badge.freezeRanges.length === 0 && badge.permissions.CanFreeze;

    const accountIsPermanentlyFrozen = accountIsFrozen && !badge.permissions.CanFreeze;
    const badgeIsNonTransferable = badge.freezeRanges.length === 0 && accountIsPermanentlyFrozen;


    let helperMsg = '';
    if (badgeIsNonTransferable) {
        helperMsg = 'This badge is non-transferable.';
    } else if (accountIsPermanentlyFrozen) {
        helperMsg = 'Your account is permanently frozen.';
    } else if (accountIsNotPermanantlyFrozenButBadgeIsNonTransferable) {
        helperMsg = 'This badge is currently non-transferable for everyone, but the manager still has permission to freeze/unfreeze accounts.';
    } else if (accountIsFrozen) {
        helperMsg = 'Your account is frozen, but the manager has permission to freeze/unfreeze accounts.';
    }


    const buttons = [];
    buttons.push(...[
        {
            name: <>Pending {accountIsFrozen && balance?.pending.length === 0 && <LockOutlined />}</>,
            icon: <BellOutlined />,
            tooltipMessage: accountIsFrozen && balance?.pending.length === 0 ? helperMsg : 'See your pending requests and transfers for this badge.',
            onClick: () => { setPendingIsVisible(true) },
            disabled: accountIsFrozen && balance?.pending.length === 0,
            count: balance?.pending?.length
        },
        {
            name: <>Transfer {accountIsFrozen && <LockOutlined />}</>,
            icon: <SwapOutlined />,
            onClick: () => { setTransferIsVisible(true) },
            tooltipMessage: accountIsFrozen ? helperMsg : `Transfer this badge to another address`,
            disabled: accountIsFrozen
        },
        {
            name: <>Request {accountIsFrozen && <LockOutlined />}</>,
            icon: <FontAwesomeIcon icon={faPersonCircleQuestion} />,
            onClick: () => { setRequestTransferIsVisible(true) },
            tooltipMessage: accountIsFrozen ? helperMsg : 'Request this badge to be transferred to you!',
            disabled: accountIsFrozen
        },
    ]);



    return (<>
        <InformationDisplayCard
            title={'Your Badges'}
            span={span}
        >
            {
                chain.connected && buttons.length > 0 && <>
                    <ButtonDisplay buttons={buttons} />
                </>
            }
            {/* {
                !accountIsPermanentlyFrozen &&
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <Text style={{ fontSize: 16, color: PRIMARY_TEXT }}>
                        You do not own any badge in this collection.
                    </Text>
                </div>
            } */}
            {
                !chain.connected && <BlockinDisplay hideLogo={true} />
            }
            <div>
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
                            <BadgeAvatarDisplay setBadgeCollection={setBadge} badgeCollection={badge} startId={start} endId={end} userBalance={balance} />
                        } labelSpan={8} valueSpan={16} />
                    })
                })}
            </div>
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
