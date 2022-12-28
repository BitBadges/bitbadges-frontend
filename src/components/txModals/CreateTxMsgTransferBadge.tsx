import React, { useEffect, useState } from 'react';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo, UserBalance, BalanceObject } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber, Steps } from 'antd';
import { AddressModalDisplayList } from './AddressModalDisplay';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressListSelect } from './AddressListSelect';

export function CreateTxMsgTransferBadgeModal({ badge, visible, setVisible, children, balance }
    : {
        badge: BitBadgeCollection,
        balance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();



    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startSubbadgeId, setStartSubbadgeId] = useState<number>(0);
    const [endSubbadgeId, setEndSubbadgeId] = useState<number>(badge.nextSubassetId - 1);

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [amounts, setAmounts] = useState<number[]>([]);
    const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);

    const [newBalance, setNewBalance] = useState<UserBalance>(balance);

    useEffect(() => {
        // console.log(balance, newBalance);
        if (!balance || !balance.balanceAmounts) return;
        let newBalanceObj: UserBalance = {
            ...balance,
        };
        let balances: number[] = [];
        for (let i = 0; i < badge.nextSubassetId; i++) {
            let currAmount = 0;
            for (const balanceObj of newBalanceObj.balanceAmounts) {
                for (const idRange of balanceObj.id_ranges) {
                    if (!idRange.end) idRange.end = idRange.start;
                    if (idRange.start <= i && idRange.end >= i) {
                        currAmount = balanceObj.balance;
                    }
                }
            }
            if (i >= startSubbadgeId && i <= endSubbadgeId) {
                balances.push(currAmount - (amountToTransfer * toAddresses.length));
            } else {
                balances.push(currAmount);
            }

        }
        console.log("A", balances)

        let newBalanceObjToSet: UserBalance = {
            ...balance,
            balanceAmounts: [],
        };
        let newBalanceAmounts: BalanceObject[] = [];
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            let existingBalanceObj = newBalanceObjToSet.balanceAmounts.find((balanceObj) => balanceObj.balance === balance);
            if (existingBalanceObj) {
                existingBalanceObj.id_ranges.push({
                    start: i,
                    end: i,
                });
            } else {
                newBalanceObjToSet.balanceAmounts.push({
                    balance,
                    id_ranges: [{
                        start: i,
                        end: i,
                    }]
                })
            }
        }


        console.log("X", newBalanceObjToSet)

        setNewBalance(newBalanceObjToSet);

    }, [amountToTransfer, startSubbadgeId, endSubbadgeId, balance, badge.nextSubassetId, toAddresses.length])

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        from: chain.accountNumber,
        badgeId: badge.id,
        toAddresses: toAddresses.map((user) => user.accountNumber),
        amounts,
        subbadgeRanges,
        expiration_time: 0, //TODO:
        cantCancelBeforeTime: 0,
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

    useEffect(() => {
        setToAddresses([]);
        setAmounts([]);
        setSubbadgeRanges([]);
        setAmountToTransfer(0);
        setStartSubbadgeId(0);
        setEndSubbadgeId(badge.nextSubassetId - 1);
    }, [visible, badge.nextSubassetId])

    const firstStepDisabled = toAddresses.length === 0;
    const secondStepDisabled = amountToTransfer <= 0 || startSubbadgeId < 0 || endSubbadgeId < 0 || startSubbadgeId > endSubbadgeId;

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

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Amount to Transfer:
                    <InputNumber
                        min={1}
                        title='Amount to Transfer'
                        value={amountToTransfer} onChange={
                            (value: number) => {
                                if (!value || value <= 0) {
                                    setAmountToTransfer(0);
                                    setAmounts([0]);
                                }
                                else {
                                    setAmountToTransfer(value);
                                    setAmounts([value]);
                                }
                            }
                        } />
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Badge ID Start:
                    <InputNumber
                        min={0}
                        max={endSubbadgeId}
                        value={startSubbadgeId} onChange={
                            (value: number) => {
                                setStartSubbadgeId(value);

                                if (value >= 0 && endSubbadgeId >= 0 && value <= endSubbadgeId) {
                                    setSubbadgeRanges([{ start: value, end: endSubbadgeId }]);
                                }
                            }
                        } />
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Badge ID End:
                    <InputNumber
                        min={0}
                        max={badge.nextSubassetId - 1}
                        title='Amount to Transfer'
                        value={endSubbadgeId} onChange={
                            (value: number) => {
                                setEndSubbadgeId(value);

                                if (startSubbadgeId >= 0 && value >= 0 && startSubbadgeId <= value) {
                                    setSubbadgeRanges([{ start: startSubbadgeId, end: value }]);
                                }
                            }
                        } />
                </div>
                <hr />
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                }}>

                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <b>Before</b>
                    </div>
                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <b>After</b>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                }}>

                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
                        {balance.balanceAmounts?.map((balanceAmount) => {
                            return balanceAmount.id_ranges.map((idRange, idx) => {
                                return <div key={idx}>
                                    <>
                                        You own <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}><b>x{balanceAmount.balance}</b></span> of IDs {idRange.start} to {idRange.end}.<br />
                                    </>
                                </div>
                            })
                        })}
                    </div>
                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
                        {newBalance.balanceAmounts?.map((balanceAmount) => {
                            console.log(balanceAmount)
                            return balanceAmount.id_ranges.map((idRange, idx) => {
                                return <div key={idx}>
                                    <>
                                        You will own <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}><b>x{balanceAmount.balance}</b></span> of IDs {idRange.start} to {idRange.end}.<br />
                                    </>
                                </div>
                            })
                        })}
                    </div>
                </div>
            </div>,
            disabled: secondStepDisabled
        },
    ];

    return (
        <TxModal
            msgSteps={items}
            unregisteredUsers={unregisteredUsers}
            onRegister={onRegister}
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Transfer Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferBadge}
            disabled={toAddresses.length === 0}
        >
            {children}
        </TxModal>
    );
}