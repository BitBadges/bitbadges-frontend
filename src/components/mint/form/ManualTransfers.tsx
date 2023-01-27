import React, { useEffect, useState } from 'react';
import { Typography, InputNumber, Button, Steps, Divider } from 'antd';
import { PRIMARY_TEXT, TERTIARY_BLUE } from '../../../constants';
import { MessageMsgNewCollection, MessageMsgTransferBadge } from 'bitbadgesjs-transactions';
import { BalanceBeforeAndAfter } from '../../common/BalanceBeforeAndAfter';
import { BitBadgesUserInfo, IdRange, UserBalance } from '../../../bitbadges-api/types';
import { TransferDisplay } from '../../common/TransferDisplay';
import { getPostTransferBalance } from '../../../bitbadges-api/balances';
import { useChainContext } from '../../../chain/ChainContext';
import { AddressListSelect } from '../../address/AddressListSelect';
import { getAccountInformation } from '../../../bitbadges-api/api';
import { AddressDisplay } from '../../address/AddressDisplay';

const { Step } = Steps;

export function ManualTransfers({
    newBadgeMsg,
    setNewBadgeMsg,
}: {
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
}) {


    const chain = useChainContext();

    const [newBalances, setNewBalances] = useState<UserBalance>({
        balances: [
            {
                balance: newBadgeMsg.badgeSupplys[0].supply,
                badgeIds: [{
                    start: 0,
                    end: newBadgeMsg.badgeSupplys[0].amount - 1,
                }]
            }
        ],
        approvals: [],
    });

    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startBadgeId, setStartBadgeId] = useState<number>(0);
    const [endBadgeId, setEndBadgeId] = useState<number>(newBadgeMsg.badgeSupplys[0].amount - 1);

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [amount, setAmount] = useState<number>(0);
    const [badgeRanges, setBadgeRanges] = useState<IdRange[]>([]);
    const [newBalance, setNewBalance] = useState<UserBalance>({} as UserBalance);

    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    useEffect(() => {
        const balance: UserBalance = {
            balances: [
                {
                    balance: newBadgeMsg.badgeSupplys[0].supply,
                    badgeIds: [{
                        start: 0,
                        end: newBadgeMsg.badgeSupplys[0].amount - 1,
                    }]
                }
            ],
            approvals: [],
        }

        console.log("pre-balance", balance);
        if (!balance) return;
        let balanceCopy = JSON.parse(JSON.stringify(balance));
        console.log("pre-balance-copy", balanceCopy);
        try {
            let newBalanceObj = getPostTransferBalance(balanceCopy, undefined, startBadgeId, endBadgeId, amountToTransfer, toAddresses.length);
            console.log("TRY", newBalanceObj)
            setNewBalance(newBalanceObj);
        } catch (e) {
            console.log("CATCH", balance)
            setNewBalance({
                ...balanceCopy,
                balances: [],
            });
        }

        setNewBadgeMsg({
            ...newBadgeMsg,
            transfers: [
                {
                    toAddresses: toAddresses.map((user) => user.accountNumber),
                    balances: [
                        {
                            balance: amountToTransfer,
                            badgeIds: [{
                                start: startBadgeId,
                                end: endBadgeId,
                            }],
                        }
                    ],
                }
            ],
        })
    }, [amountToTransfer, startBadgeId, endBadgeId, toAddresses.length, newBadgeMsg, setNewBadgeMsg, toAddresses])

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);


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


    const firstStepDisabled = toAddresses.length === 0;
    const secondStepDisabled = amountToTransfer <= 0 || startBadgeId < 0 || endBadgeId < 0 || startBadgeId > endBadgeId || !!newBalance.balances.find((balance) => balance.balance < 0);

    const msgSteps = [
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
                        max={newBadgeMsg.badgeSupplys[0].amount - 1}
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
                    // badge={badge}
                    // setBadgeCollection={setBadgeCollection}
                    from={[{
                        chain: chain.chain,
                        address: chain.address,
                        accountNumber: chain.accountNumber,
                        cosmosAddress: chain.cosmosAddress,
                    }]}
                    to={toAddresses}
                />
                <hr />
                <BalanceBeforeAndAfter balance={{
                    balances: [
                        {
                            balance: newBadgeMsg.badgeSupplys[0].supply,
                            badgeIds: [{
                                start: 0,
                                end: newBadgeMsg.badgeSupplys[0].amount - 1,
                            }]
                        }
                    ],
                    approvals: [],
                }} newBalance={newBalance} partyString='Unminted' />
            </div>,
            disabled: secondStepDisabled
        },

    ];


    return <div style={{ textAlign: 'center', color: PRIMARY_TEXT, backgroundColor: TERTIARY_BLUE }}>
        <Steps
            current={currentStep}
            onChange={onStepChange}
            direction="vertical"
        >
            {msgSteps && msgSteps.map((item, index) => (
                <Step
                    key={index}
                    title={<b>{item.title}</b>} description={
                        <div>
                            {currentStep === index && <div>
                                {item.description}
                            </div>}
                        </div>
                    }
                    disabled={msgSteps && msgSteps.find((step, idx) => step.disabled && idx < index) ? true : false}
                />
            ))}

        </Steps>
    </div>
}