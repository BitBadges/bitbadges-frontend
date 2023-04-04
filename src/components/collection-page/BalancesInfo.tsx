import {
    GiftOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { Empty } from 'antd';
import { AllAddressesTransferMapping, BitBadgeCollection, BitBadgesUserInfo, SupportedChain, UserBalance, getBlankBalance, getSupplyByBadgeId, isAddressValid } from 'bitbadges-sdk';
import { useEffect, useState } from 'react';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { ButtonDisplay, ButtonDisplayProps } from '../display/ButtonDisplay';
import { CreateTxMsgTransferBadgeModal } from '../tx-modals/CreateTxMsgTransferBadge';


export function BalanceOverview({ collection, balance, setTab, refreshUserBalance, isPreview, badgeId, onlyButtons }: {
    collection: BitBadgeCollection | undefined;
    refreshUserBalance: () => Promise<void>;
    balance: UserBalance | undefined;
    setTab: (tab: string) => void;
    isPreview?: boolean;
    badgeId?: number;
    onlyButtons?: boolean;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);
    const [currBalance, setCurrBalance] = useState<UserBalance>();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>(chain.connected ? {
        name: chain.name,
        avatar: chain.avatar,
        chain: chain.chain,
        address: chain.address,
        cosmosAddress: chain.cosmosAddress,
        accountNumber: chain.accountNumber,
        github: chain.github,
        discord: chain.discord,
        twitter: chain.twitter,
        telegram: chain.telegram,
    } : {
        name: '',
        avatar: '',
        chain: SupportedChain.UNKNOWN,
        address: '',
        cosmosAddress: '',
        accountNumber: -1
    });

    useEffect(() => {
        if (chain.connected) {
            setCurrUserInfo({
                name: chain.name,
                avatar: chain.avatar,
                chain: chain.chain,
                address: chain.address,
                cosmosAddress: chain.cosmosAddress,
                accountNumber: chain.accountNumber,
                github: chain.github,
                discord: chain.discord,
                twitter: chain.twitter,
                telegram: chain.telegram,
            });
        }
    }, [chain]);

    useEffect(() => {
        async function refreshBalance() {
            if (isAddressValid(currUserInfo.address) && collection) {
                try {
                    const res = await getBadgeBalance(collection.collectionId, currUserInfo.accountNumber);
                    setCurrBalance(res.balance);
                } catch (e) {
                    setCurrBalance({
                        balances: [],
                        approvals: []
                    });
                }

            } else {
                setCurrBalance({
                    balances: [],
                    approvals: []
                });
            }
        }

        refreshBalance();
    }, [currUserInfo, collection])

    if (!collection) return <></>;

    const buttons: ButtonDisplayProps[] = [];

    const activeClaimIds: number[] = []
    const activeClaims = collection ? collection?.claims.filter((x, idx) => {
        if (x.balances.length > 0) {
            if (badgeId) {
                const supply = getSupplyByBadgeId(badgeId, x.balances);
                if (supply > 0) {
                    activeClaimIds.push(idx + 1);
                    return true;
                }
            } else {
                activeClaimIds.push(idx + 1);
                return true;
            }
        }
        return false;
    }) : [];

    // const isTransferable = !collection.disallowedTransfers?.length;
    const isNonTransferable = collection.disallowedTransfers?.length === 1
        && JSON.stringify(collection.disallowedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
        && JSON.stringify(collection.disallowedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from);

    const noApprovedTransfers = !collection.managerApprovedTransfers?.length;
    // const allApprovedTransfers = collection.managerApprovedTransfers?.length === 1
    //     && JSON.stringify(collection.managerApprovedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
    //     && JSON.stringify(collection.managerApprovedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from);

    const isManager = chain.accountNumber === collection.manager.accountNumber;

    const canTransfer = !isNonTransferable || (isManager && !noApprovedTransfers);

    if (canTransfer) {
        buttons.push(
            {
                name: <>Transfer</>,
                icon: <SwapOutlined />,
                onClick: () => {
                    setTransferIsVisible(true)
                },
                tooltipMessage: badgeId ? 'Transfer this badge to another address.' : `Transfer badge(s) to another address.`,
                disabled: isPreview
            }
        );
    }

    if (activeClaims.length > 0) {
        buttons.push(
            {
                name: <>Claim</>,
                icon: <GiftOutlined />,
                onClick: () => {
                    setTab('claims')
                },
                // count: activeClaims.length,
                tooltipMessage: `Check if you can claim this badge`,
                disabled: isPreview
            },
        );
    }

    if (onlyButtons) {
        return <>
            {
                chain.connected && <>{buttons.length > 0 && <ButtonDisplay buttons={buttons} />}</>
            }
            {
                !chain.connected && <BlockinDisplay hideLogo={true} />
            }
            {!isPreview &&
                <CreateTxMsgTransferBadgeModal
                    collection={collection}
                    visible={transferIsVisible}
                    setVisible={setTransferIsVisible}
                    userBalance={balance ? balance : getBlankBalance()}
                    refreshUserBalance={refreshUserBalance}
                />
            }
        </>
    }



    return (<div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Balance Checker</h3> */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
            <AddressSelect hideAddressDisplay currUserInfo={currUserInfo} setCurrUserInfo={setCurrUserInfo} darkMode fontColor={PRIMARY_TEXT} />
            {<>
                <br />
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <AddressDisplay userInfo={currUserInfo} darkMode fontColor={PRIMARY_TEXT} />
                </div>
            </>}
        </div>
        <div
            style={{ color: PRIMARY_TEXT, display: 'flex', justifyContent: 'center', width: '100%', marginTop: 16 }}
        >
            {isPreview && <>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ color: PRIMARY_TEXT }}
                    description={<span style={{ color: PRIMARY_TEXT }}>Not supported for previews.</span>}
                ></Empty>
            </>}
            {
                currBalance && !isPreview && <>
                    {/* {buttons.length > 0 && <ButtonDisplay buttons={buttons} />} */}
                    {<div>
                        {<BalanceDisplay
                            collection={collection}
                            balance={currBalance}
                        />}
                    </div>}
                </>
            }
            {/* {
                !chain.connected && <BlockinDisplay hideLogo={true} />
            } */}
        </div>

        {!isPreview &&
            <CreateTxMsgTransferBadgeModal
                collection={collection}
                visible={transferIsVisible}
                setVisible={setTransferIsVisible}
                userBalance={balance ? balance : getBlankBalance()}
                refreshUserBalance={refreshUserBalance}
            />
        }
    </div>
    );
}
