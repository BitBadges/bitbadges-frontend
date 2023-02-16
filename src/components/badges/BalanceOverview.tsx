import {
    GiftOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { Typography } from 'antd';
import { useState } from 'react';
import { getBlankBalance } from '../../bitbadges-api/balances';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { BalanceDisplay } from '../common/BalanceDisplay';
import { ButtonDisplay, ButtonDisplayProps } from '../common/ButtonDisplay';
import { InformationDisplayCard } from '../common/InformationDisplayCard';
import { CreateTxMsgTransferBadgeModal } from '../txModals/CreateTxMsgTransferBadge';

const { Text } = Typography;

export function BalanceOverview({ badge, setBadge, metadata, balance, span, setTab, setUserBalance }: {
    badge: BitBadgeCollection | undefined;
    setBadge: () => void;
    setUserBalance: () => void;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
    span?: number;
    setTab: (tab: string) => void;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);
    const [claimIsVisible, setClaimIsVisible] = useState<boolean>(false);
    const [requestTransferIsVisible, setRequestTransferIsVisible] = useState<boolean>(false);
    const [pendingIsVisible, setPendingIsVisible] = useState<boolean>(false);


    if (!badge || !metadata) return <></>;



    //TODO:
    // const accountIsInFreezeRanges = chain.accountNumber ? badge?.freezeRanges.some(range => {
    //     return range.start <= chain.accountNumber && range.end >= chain.accountNumber;
    // }) : false;

    // const accountIsFrozen = (badge.permissions.FrozenByDefault && !accountIsInFreezeRanges) || (!badge.permissions.FrozenByDefault && accountIsInFreezeRanges);
    // const accountIsNotPermanantlyFrozenButBadgeIsNonTransferable = accountIsFrozen && badge.freezeRanges.length === 0 && badge.permissions.CanFreeze;

    // const accountIsPermanentlyFrozen = accountIsFrozen && !badge.permissions.CanFreeze;
    // const badgeIsNonTransferable = badge.freezeRanges.length === 0 && accountIsPermanentlyFrozen;


    // let helperMsg = '';
    // if (badgeIsNonTransferable) {
    //     helperMsg = 'This badge is non-transferable.';
    // } else if (accountIsPermanentlyFrozen) {
    //     helperMsg = 'Your account is permanently frozen.';
    // } else if (accountIsNotPermanantlyFrozenButBadgeIsNonTransferable) {
    //     helperMsg = 'This badge is currently non-transferable for everyone, but the manager still has permission to freeze/unfreeze accounts.';
    // } else if (accountIsFrozen) {
    //     helperMsg = 'Your account is frozen, but the manager has permission to freeze/unfreeze accounts.';
    // }


    const buttons: ButtonDisplayProps[] = [];
    buttons.push(...[
        // {
        //     name: <>Pending {accountIsFrozen && balance?.pending.length === 0 && <LockOutlined />}</>,
        //     icon: <BellOutlined />,
        //     tooltipMessage: accountIsFrozen && balance?.pending.length === 0 ? helperMsg : 'See your pending requests and transfers for this badge.',
        //     onClick: () => { setPendingIsVisible(true) },
        //     disabled: accountIsFrozen && balance?.pending.length === 0,
        //     count: balance?.pending?.length
        // },
        // {
        //     name: <>Transfer {accountIsFrozen && <LockOutlined />}</>,
        //     icon: <SwapOutlined />,
        //     onClick: () => { setTransferIsVisible(true) },
        //     tooltipMessage: accountIsFrozen ? helperMsg : `Transfer this badge to another address`,
        //     disabled: accountIsFrozen
        // },
        {
            name: <>Transfer</>,
            icon: <SwapOutlined />,
            onClick: () => { setTransferIsVisible(true) },
            tooltipMessage: !balance ? 'You do not own any badges in this collection.' : `Transfer this badge to another address`,
            disabled: !balance
        },
        {
            name: <>Claim</>,
            icon: <GiftOutlined />,
            onClick: () => { setTab('claims') },
            tooltipMessage: `Check if you can claim this badge`,
            count: badge.claims?.filter(x => x.leaves?.indexOf(chain.cosmosAddress) >= 0).length,
            disabled: false
        },
        // {
        //     name: <>Request {accountIsFrozen && <LockOutlined />}</>,
        //     icon: <FontAwesomeIcon icon={faPersonCircleQuestion} />,
        //     onClick: () => { setRequestTransferIsVisible(true) },
        //     tooltipMessage: accountIsFrozen ? helperMsg : 'Request this badge to be transferred to you!',
        //     disabled: accountIsFrozen
        // },
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
                {balance && <BalanceDisplay
                    collection={badge}
                    setCollection={setBadge}
                    balance={balance}
                />}
            </div>
        </InformationDisplayCard>

        <CreateTxMsgTransferBadgeModal
            badge={badge ? badge : {} as BitBadgeCollection}
            setBadgeCollection={setBadge}
            visible={transferIsVisible}
            setVisible={setTransferIsVisible}
            userBalance={balance ? balance : getBlankBalance()}
            setUserBalance={setUserBalance}
        />

        {/* <CreateTxMsgClaimBadgeModal
            badge={badge ? badge : {} as BitBadgeCollection}
            setBadgeCollection={setBadge}
            visible={claimIsVisible}
            setVisible={setClaimIsVisible}
            balance={balance ? balance : getBlankBalance()}
            merkleTree={merkleTree[claimId]}
        /> */}

        {/* <CreateTxMsgRequestTransferBadgeModal
            badge={badge ? badge : {} as BitBadgeCollection}
            visible={requestTransferIsVisible}
            setVisible={setRequestTransferIsVisible}
            balance={balance ? balance : getBlankBalance()}
        /> */}
        {/* 
        <CreateTxMsgHandlePendingTransferModal
            badge={badge ? badge : {} as BitBadgeCollection}
            visible={pendingIsVisible}
            setVisible={setPendingIsVisible}
            balance={balance ? balance : getBlankBalance()}
        /> */}
    </>
    );
}
