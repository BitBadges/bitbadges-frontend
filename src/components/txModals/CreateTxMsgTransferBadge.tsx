import React, { useEffect, useState } from 'react';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { InputNumber } from 'antd';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressListSelect } from '../address/AddressListSelect';
import { getPostTransferBalance } from '../../bitbadges-api/balances';
import { BalanceBeforeAndAfter } from '../common/BalanceBeforeAndAfter';
import { TransferDisplay } from '../common/TransferDisplay';

export function CreateTxMsgTransferBadgeModal(
    {
        badge, visible, setVisible, children, balance
    }: {
        badge: BitBadgeCollection,
        balance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();

    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startSubbadgeId, setStartSubbadgeId] = useState<number>(0);
    const [endSubbadgeId, setEndSubbadgeId] = useState<number>(badge.nextSubassetId - 1);

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [amounts, setAmounts] = useState<number[]>([]);
    const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);

    const [newBalance, setNewBalance] = useState<UserBalance>(balance);

    useEffect(() => {
        if (!balance || !balance.balanceAmounts) return;
        try {
            let newBalanceObj = getPostTransferBalance(balance, badge, startSubbadgeId, endSubbadgeId, amountToTransfer, toAddresses.length);

            setNewBalance(newBalanceObj);
        } catch (e) {
            setNewBalance({
                ...balance,
                balanceAmounts: [],
            });
        }

    }, [amountToTransfer, startSubbadgeId, endSubbadgeId, balance, badge, toAddresses.length])

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        from: chain.accountNumber,
        badgeId: badge.id,
        toAddresses: toAddresses.map((user) => user.accountNumber),
        amounts,
        subbadgeRanges,
        expirationTime: 0, //TODO:
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

    //Upon visible turning to false, reset to initial state
    useEffect(() => {
        setToAddresses([]);
        setAmounts([]);
        setSubbadgeRanges([]);
        setAmountToTransfer(0);
        setStartSubbadgeId(0);
        setEndSubbadgeId(badge.nextSubassetId - 1);
        setNewBalance(balance);
    }, [visible, badge.nextSubassetId, balance]);


    const firstStepDisabled = toAddresses.length === 0;
    const secondStepDisabled = amountToTransfer <= 0 || startSubbadgeId < 0 || endSubbadgeId < 0 || startSubbadgeId > endSubbadgeId || !!newBalance.balanceAmounts.find((balance) => balance.balance < 0);

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
                                    setAmounts([0]);
                                }
                                else {
                                    setAmountToTransfer(value);
                                    setAmounts([value]);
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
                <div className='flex-between'
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
                        }
                    />
                </div>
                <hr />

                <TransferDisplay
                    amount={amountToTransfer * toAddresses.length}
                    startId={startSubbadgeId}
                    endId={endSubbadgeId}
                    badge={badge}
                    from={[{
                        chain: chain.chain,
                        address: chain.address,
                        accountNumber: chain.accountNumber,
                        cosmosAddress: chain.cosmosAddress,
                    }]}
                    to={toAddresses}

                />
                <hr />
                <BalanceBeforeAndAfter balance={balance} newBalance={newBalance} partyString='Your' />
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
            displayMsg={badge.permissions.ForcefulTransfers ? `As soon as the transaction is confirmed, the badges will be transferred to the recipient(s).`
                : `This badge will go into a pending queue until the recipient accepts or denies the transfer. If the recipient denies the transfer, the badge(s) will be returned to your wallet.`}
        >
            {children}
        </TxModal>
    );
}