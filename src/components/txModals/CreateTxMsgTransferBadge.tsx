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
import { CalendarOutlined } from '@ant-design/icons';

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
    const [expirationTime, setExpirationTime] = useState<number>(0);
    const [cantCancelBeforeTime, setCantCancelBeforeTime] = useState<number>(0);
    const [expirationTimeChecked, setExpirationTimeChecked] = useState<boolean>(false);
    const [cantCancelBeforeTimeChecked, setCantCancelBeforeTimeChecked] = useState<boolean>(false);

    const [newBalance, setNewBalance] = useState<UserBalance>({} as UserBalance);

    useEffect(() => {
        if (!balance || !balance.balanceAmounts) return;
        let balanceCopy = JSON.parse(JSON.stringify(balance));

        try {
            let newBalanceObj = getPostTransferBalance(balanceCopy, badge, startSubbadgeId, endSubbadgeId, amountToTransfer, toAddresses.length);
            console.log("TRY", newBalanceObj)
            setNewBalance(newBalanceObj);
        } catch (e) {
            console.log("CATCH", balance)
            setNewBalance({
                ...balanceCopy,
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
        expirationTime: expirationTime,
        cantCancelBeforeTime: cantCancelBeforeTime,
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
        setNewBalance(JSON.parse(JSON.stringify(balance)));
        setExpirationTime(0);
        setCantCancelBeforeTime(0);
        setExpirationTimeChecked(false);
        setCantCancelBeforeTimeChecked(false);
    }, [visible, badge.nextSubassetId, balance]);


    const firstStepDisabled = toAddresses.length === 0;
    const secondStepDisabled = amountToTransfer <= 0 || startSubbadgeId < 0 || endSubbadgeId < 0 || startSubbadgeId > endSubbadgeId || !!newBalance.balanceAmounts.find((balance) => balance.balance < 0);
    const thirdStepDisabled = false;

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

    if (!badge.permissions.ForcefulTransfers) {
        items.push({
            title: 'Set Acceptance Deadlines',
            description: <div>
                <div>
                    This badge will go into a pending queue until the recipient accept the transfer
                    or you cancel the transfer.
                </div>
                <Divider />
                <div className='flex-between'>
                    Recipient Must Accept By Certain Date?
                    <Switch
                        checked={expirationTimeChecked}
                        onChange={(checked) => {
                            setExpirationTimeChecked(checked);
                            if (!checked) {
                                setExpirationTime(0);
                            }
                        }}
                    />
                </div>
                <br />
                {expirationTimeChecked &&
                    <div className='flex-center'>
                        <DatePicker
                            className="date-picker-black"

                            suffixIcon={
                                <CalendarOutlined />
                            }
                            onChange={(date, dateString) => {
                                if (date) {
                                    setExpirationTime(new Date(dateString).valueOf() / 1000);
                                } else {
                                    setExpirationTime(0);
                                }

                            }}
                        />
                    </div>
                }
                <div className='flex-center'>
                    {expirationTime == 0 ? <b>Recipient can accept / reject anytime.</b> : <b>Recipient must accept / reject by {new Date(expirationTime * 1000).toISOString()}</b>}
                </div>
                <Divider />
                <div className='flex-between'>
                    Lock Your Ability to Cancel Until Certain Date?
                    <Switch
                        checked={cantCancelBeforeTimeChecked}
                        onChange={(checked) => {
                            setCantCancelBeforeTimeChecked(checked);
                            if (!checked) {
                                setCantCancelBeforeTime(0);
                            }
                        }}
                    />
                </div>
                <br />
                {cantCancelBeforeTimeChecked &&
                    <div className='flex-between'
                    >
                        You Cannot Cancel Before:
                        <div className="date-picker-black">
                            <DatePicker
                                style={{
                                    color: 'black',
                                }}
                                className="date-picker-black"

                                suffixIcon={
                                    <CalendarOutlined />
                                }
                                onChange={(date, dateString) => {
                                    if (date) {
                                        setCantCancelBeforeTime(new Date(dateString).valueOf() / 1000);
                                    } else {
                                        setCantCancelBeforeTime(0);
                                    }

                                }}
                            />
                        </div>

                    </div>
                }
                <div className='flex-center'>
                    {cantCancelBeforeTime == 0 ? <b>You can cancel anytime.</b> : <b>You must wait to cancel until {new Date(cantCancelBeforeTime * 1000).toISOString()}</b>}
                </div>
                <Divider />
            </div>,
            disabled: thirdStepDisabled
        })
    }


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