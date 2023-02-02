import React, { useEffect, useState } from 'react';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { DatePicker, Divider, InputNumber, Switch } from 'antd';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressListSelect } from '../address/AddressListSelect';
import { getPostTransferBalance } from '../../bitbadges-api/balances';
import { BalanceBeforeAndAfter } from '../common/BalanceBeforeAndAfter';
import { TransferDisplay } from '../common/TransferDisplay';

//TODO: check for disallowedTransfers
export function CreateTxMsgTransferBadgeModal(
    {
        badge, visible, setVisible, children, balance, setBadgeCollection
    }: {
        badge: BitBadgeCollection,
        setBadgeCollection: (badge: BitBadgeCollection) => void,
        balance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();

    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startBadgeId, setStartBadgeId] = useState<number>(0);
    const [endBadgeId, setEndBadgeId] = useState<number>(badge.nextBadgeId - 1);

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [amount, setAmount] = useState<number>(0);
    const [badgeRanges, setBadgeRanges] = useState<IdRange[]>([]);
    const [newBalance, setNewBalance] = useState<UserBalance>({} as UserBalance);

    useEffect(() => {
        console.log("pre-balance", balance);
        if (!balance) return;
        let balanceCopy = JSON.parse(JSON.stringify(balance));
        console.log("pre-balance-copy", balanceCopy);
        try {
            let newBalanceObj = getPostTransferBalance(balanceCopy, startBadgeId, endBadgeId, amountToTransfer, toAddresses.length);
            console.log("TRY", newBalanceObj)
            setNewBalance(newBalanceObj);
        } catch (e) {
            console.log("CATCH", balance)
            setNewBalance({
                ...balanceCopy,
                balances: [],
            });
        }

    }, [amountToTransfer, startBadgeId, endBadgeId, balance, badge, toAddresses.length])

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        from: chain.accountNumber,
        collectionId: badge.collectionId,
        transfers: [
            {
                toAddresses: toAddresses.map((user) => user.accountNumber),
                balances: [
                    {
                        balance: amount,
                        badgeIds: badgeRanges,
                    },
                ],
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
        setAmount(0);
        setBadgeRanges([]);
        setAmountToTransfer(0);
        setStartBadgeId(0);
        setEndBadgeId(badge.nextBadgeId - 1);
        setNewBalance(JSON.parse(JSON.stringify(balance)));
    }, [visible, badge.nextBadgeId, balance]);


    const firstStepDisabled = toAddresses.length === 0;
    const secondStepDisabled = amountToTransfer <= 0 || startBadgeId < 0 || endBadgeId < 0 || startBadgeId > endBadgeId || !!newBalance.balances.find((balance) => balance.balance < 0);

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
                <div className='flex-between'>
                    Amount to Transfer Per Recipient:
                    <InputNumber
                        min={1}
                        title='Amount to Transfer'
                        value={amountToTransfer} onChange={
                            (value: number) => {
                                if (!value || value <= 0) {
                                    setAmountToTransfer(0);
                                    setAmount(0);
                                }
                                else {
                                    setAmountToTransfer(value);
                                    setAmount(value);
                                }
                            }
                        }
                    />
                </div>
                <div className='flex-between'
                >
                    Badge ID Start:
                    <InputNumber
                        min={0}
                        max={endBadgeId}
                        value={startBadgeId} onChange={
                            (value: number) => {
                                setStartBadgeId(value);

                                if (value >= 0 && endBadgeId >= 0 && value <= endBadgeId) {
                                    setBadgeRanges([{ start: value, end: endBadgeId }]);
                                }
                            }
                        } />
                </div>
                <div className='flex-between'
                >
                    Badge ID End:
                    <InputNumber
                        min={0}
                        max={badge.nextBadgeId - 1}
                        title='Amount to Transfer'
                        value={endBadgeId} onChange={
                            (value: number) => {
                                setEndBadgeId(value);

                                if (startBadgeId >= 0 && value >= 0 && startBadgeId <= value) {
                                    setBadgeRanges([{ start: startBadgeId, end: value }]);
                                }
                            }
                        }
                    />
                </div>
                <hr />

                <TransferDisplay
                    amount={amountToTransfer * toAddresses.length}
                    startId={startBadgeId}
                    endId={endBadgeId}
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
                <BalanceBeforeAndAfter collection={badge} balance={balance} newBalance={newBalance} partyString='Your' />
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