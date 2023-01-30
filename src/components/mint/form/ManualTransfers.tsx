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
import MerkleTree from 'merkletreejs';
import { SHA256 } from 'crypto-js';

const crypto = require('crypto');

const { Step } = Steps;


enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,
}

interface LeafItem {
    addressOrCode: string;
    amount: number;
    badgeIds: IdRange[];
}

export function ManualTransfers({
    newBadgeMsg,
    setNewBadgeMsg,
    distributionMethod,
    setLeaves
}: {
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    distributionMethod: DistributionMethod;
    setLeaves: (leaves: string[]) => void;
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
    const [badgeRanges, setBadgeRanges] = useState<IdRange[]>([{ start: 0, end: 0 }]);
    const [newBalance, setNewBalance] = useState<UserBalance>({} as UserBalance);
    const [codes, setCodes] = useState<string[]>([]);
    const [numCodes, setNumCodes] = useState<number>(0);
    const [leafs, setLeafs] = useState<LeafItem[]>([]);

    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    useEffect(() => {
        if (distributionMethod === DistributionMethod.Codes) {
            setLeafs(codes.map((code) => {
                return {
                    addressOrCode: code,
                    amount: amount,
                    badgeIds: badgeRanges,
                }
            }));
        } else if (distributionMethod === DistributionMethod.SpecificAddresses) {
            setLeafs(toAddresses.map((address) => {
                return {
                    addressOrCode: address.cosmosAddress,
                    amount: amount,
                    badgeIds: badgeRanges,
                }
            }));
        }
    }, [codes, amount, badgeRanges, distributionMethod, toAddresses]);

    useEffect(() => {

        const newLeaves = leafs.map(x => {
            let str = '';
            if (distributionMethod === DistributionMethod.Codes) {
                str = x.addressOrCode + '--';
            } else if (distributionMethod === DistributionMethod.SpecificAddresses) {
                str = "-" + x.addressOrCode + "-";
            }
            str += x.amount + "-" + x.badgeIds[0]?.start + "-" + x.badgeIds[0]?.end;
            return str;
        });

        setLeaves(newLeaves);

        const hashes = newLeaves.map(x => {
            return SHA256(x)
        });

        const tree = new MerkleTree(hashes, SHA256, { duplicateOdd: true })
        const root = tree.getRoot().toString('hex')


        setNewBadgeMsg({
            ...newBadgeMsg,
            claims: [
                {
                    amountPerClaim: 0,
                    balances: newBalances.balances,
                    type: 0,
                    uri: "",
                    data: root,
                    timeRange: {
                        start: 0,
                        end: Number.MAX_SAFE_INTEGER //TODO: change to max uint64,
                    },
                    incrementIdsBy: 0,
                    badgeIds: [],
                }
            ]
        })
    }, [newBalances, setNewBadgeMsg, newBadgeMsg, distributionMethod, leafs, setLeaves]);



    const firstStepDisabled = toAddresses.length === 0;
    const firstStepDisabledCodes = codes.length === 0;
    // const secondStepDisabled = amountToTransfer <= 0 || startBadgeId < 0 || endBadgeId < 0 || startBadgeId > endBadgeId || !!newBalance.balances.find((balance) => balance.balance < 0);

    const msgSteps = [
        distributionMethod === DistributionMethod.SpecificAddresses ? {
            title: `Add Recipients (${toAddresses.length})`,
            description: <AddressListSelect
                users={toAddresses}
                setUsers={setToAddresses}
            />,
            disabled: firstStepDisabled,
        } : {
            title: 'Create Codes',
            description: <div>
                <>
                    <div className='flex-between'>
                        How Many Codes to Create?
                        <InputNumber
                            value={numCodes}
                            min={1}
                            title='Number of Codes'
                            onChange={
                                (value: number) => {
                                    setCodes([...Array(value)].map((i) => crypto.randomBytes(32).toString('hex')));
                                    // console.log(codes);
                                    setNumCodes(value);
                                }
                            }
                        />
                    </div>
                    <Divider />
                </>
            </div>,
            disabled: firstStepDisabledCodes,
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

                {/* <TransferDisplay
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
                <hr /> */}
                {//TODO: display leftover badges
                }
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
            // disabled: secondStepDisabled
        },

    ];


    return <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
        {msgSteps && msgSteps.map((item, index) => (
            <> {item.description}</>
        ))}

        <Divider />
        {leafs.map((leaf, index) => {
            return <div key={index}>
                <div className='flex-between'>
                    <div>
                        <div>
                            {distributionMethod === DistributionMethod.SpecificAddresses ? 'Address' : 'Code'} {index + 1}</div>
                        <div>{leaf.addressOrCode}</div>
                    </div>
                    <div>
                        <div>Amount</div>
                        <div>{leaf.amount}</div>
                    </div>
                    <div>
                        <div>Badge ID Start</div>
                        <div>{leaf.badgeIds[0]?.start}</div>
                    </div>
                    <div>
                        <div>Badge ID End</div>
                        <div>{leaf.badgeIds[0]?.end}</div>
                    </div>
                </div>
                <Divider />
            </div>
        })}
    </div>
}