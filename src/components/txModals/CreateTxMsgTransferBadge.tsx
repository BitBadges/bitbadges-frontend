import React, { useEffect, useState } from 'react';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, BitBadgesUserInfo, UserBalance, Balance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressListSelect } from '../address/AddressListSelect';
import { getBlankBalance, getPostTransferBalance } from '../../bitbadges-api/balances';
import { BalanceBeforeAndAfter } from '../common/BalanceBeforeAndAfter';
import { TransferDisplay } from '../common/TransferDisplay';
import { BalancesInput } from '../common/BalancesInput';
import { getFullBadgeIdRanges } from '../../bitbadges-api/badges';
import { Divider } from 'antd';

//TODO: check for disallowedTransfers / managerApprovedTransfers
export function CreateTxMsgTransferBadgeModal(
    {
        badge, visible, setVisible, children, userBalance, setBadgeCollection
    }: {
        badge: BitBadgeCollection,
        setBadgeCollection: (badge: BitBadgeCollection) => void,
        userBalance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [balances, setBalances] = useState<Balance[]>([
        {
            balance: 1,
            badgeIds: getFullBadgeIdRanges(badge)
        },
    ]);
    const [postTransferBalance, setPostTransferBalance] = useState<UserBalance>();


    useEffect(() => {
        if (!userBalance || userBalance === getBlankBalance()) return;
        let postTransferBalanceObj = userBalance;
        for (const balance of balances) {
            for (const idRange of balance.badgeIds) {
                postTransferBalanceObj = getPostTransferBalance(postTransferBalanceObj, idRange.start, idRange.end, balance.balance, toAddresses.length);
            }
        }

        setPostTransferBalance(postTransferBalanceObj);
    }, [balances, userBalance, badge, toAddresses.length])

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        collectionId: badge.collectionId,
        from: chain.accountNumber,
        transfers: [
            {
                toAddresses: toAddresses.map((user) => user.accountNumber),
                balances
            }
        ],
    };

    const onRegister = async () => {
        let allRegisteredUsers = toAddresses.filter((user) => user.accountNumber !== -1);
        let newUsersToRegister = toAddresses.filter((user) => user.accountNumber === -1);
        for (const user of newUsersToRegister) {
            const newAccountNumber = await getAccountInformation(user.cosmosAddress).then((accountInfo) => {
                return accountInfo.account_number;
            });
            allRegisteredUsers.push({ ...user, accountNumber: newAccountNumber });
        }

        setToAddresses(allRegisteredUsers);
    }

    //Upon visible turning to false, reset to initial state
    useEffect(() => {
        setToAddresses([]);
        setPostTransferBalance(JSON.parse(JSON.stringify(userBalance)));
    }, [visible, userBalance]);


    const firstStepDisabled = toAddresses.length === 0;
    const secondStepDisabled = balances.length == 0 || !!postTransferBalance?.balances?.find((balance) => balance.balance < 0);

    const items = [
        {
            title: `Add Recipients (${toAddresses.length})`,
            description: <AddressListSelect
                users={toAddresses}
                setUsers={setToAddresses}
            />,
            disabled: firstStepDisabled,
        },
        {
            title: 'Select Badges and Amounts',
            description: <div>
                <br />
                <BalancesInput
                    balances={balances}
                    setBalances={setBalances}
                    collection={badge}
                />
                {/* <hr /> */}
                <Divider />
                {balances.map((balance, index) => {
                    // console.log(balance);
                    return <div key={index}>
                        <TransferDisplay
                            hideAddresses
                            amount={Number(balance.balance) * toAddresses.length}
                            badgeIds={balance.badgeIds}
                            badge={badge}
                            setBadgeCollection={setBadgeCollection}
                            from={[{
                                chain: chain.chain,
                                address: chain.address,
                                accountNumber: chain.accountNumber,
                                cosmosAddress: chain.cosmosAddress,
                            }]}
                            to={toAddresses}
                        />
                        {/* <hr /> */}
                    </div>
                })}
                <Divider />
                {postTransferBalance && <BalanceBeforeAndAfter collection={badge} balance={userBalance} newBalance={postTransferBalance} partyString='Your' beforeMessage='Before Transfer' afterMessage='After Transfer' />}
            </div>,
            disabled: secondStepDisabled
        },

    ];


    return (
        <TxModal
            msgSteps={items}
            unregisteredUsers={unregisteredUsers}
            onRegister={onRegister}
            visible={visible}
            setVisible={setVisible}
            txName="Transfer Badge(s)"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferBadge}
            displayMsg={<div>
                {balances.map((balance, index) => {
                    // console.log(balance);
                    return <div key={index}>
                        <TransferDisplay
                            amount={Number(balance.balance) * toAddresses.length}
                            badgeIds={balance.badgeIds}
                            badge={badge}
                            setBadgeCollection={setBadgeCollection}
                            from={[{
                                chain: chain.chain,
                                address: chain.address,
                                accountNumber: chain.accountNumber,
                                cosmosAddress: chain.cosmosAddress,
                            }]}
                            to={toAddresses}
                        />
                    </div>
                })}
            </div>}
        >
            {children}
        </TxModal>
    );
}