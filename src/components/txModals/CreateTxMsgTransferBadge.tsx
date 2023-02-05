import React, { useEffect, useState } from 'react';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo, UserBalance, Balance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { InputNumber } from 'antd';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressListSelect } from '../address/AddressListSelect';
import { getPostTransferBalance } from '../../bitbadges-api/balances';
import { BalanceBeforeAndAfter } from '../common/BalanceBeforeAndAfter';
import { TransferDisplay } from '../common/TransferDisplay';
import { IdRangesInput } from '../common/IdRangesInput';
import { BalancesInput } from '../common/BalancesInput';

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
    const [balances, setBalances] = useState<Balance[]>([]);
    const [newBalance, setNewBalance] = useState<UserBalance>({} as UserBalance);

    useEffect(() => {
        if (!userBalance) return;
        let newBalanceObj = userBalance;
        for (const balance of balances) {
            for (const idRange of balance.badgeIds) {
                newBalanceObj = getPostTransferBalance(userBalance, idRange.start, idRange.end, balance.balance, toAddresses.length);
            }
        }

        setNewBalance(newBalanceObj);
    }, [balances, userBalance, badge, toAddresses.length])

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        from: chain.accountNumber,
        collectionId: badge.collectionId,
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
        setNewBalance(JSON.parse(JSON.stringify(userBalance)));
    }, [visible, userBalance]);


    const firstStepDisabled = toAddresses.length === 0;
    const secondStepDisabled = balances.length == 0 || !!newBalance.balances.find((balance) => balance.balance < 0);

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
            title: 'Select IDs and Amounts',
            description: <div>
                <BalancesInput
                    balances={balances}
                    setBalances={setBalances}
                    collection={badge}
                />
                <hr />
                {balances.map((balance, index) => {
                    return <div key={index}>
                        <TransferDisplay
                            amount={balance.balance * toAddresses.length}
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
                        <hr />
                    </div>
                })}
                <BalanceBeforeAndAfter collection={badge} balance={userBalance} newBalance={newBalance} partyString='Your' />
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
            txName="Transfer Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferBadge}

        >
            {children}
        </TxModal>
    );
}