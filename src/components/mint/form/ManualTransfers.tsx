import React, { useEffect, useState } from 'react';
import { Typography, InputNumber, Button, Steps, Divider } from 'antd';
import { MINT_ACCOUNT, PRIMARY_TEXT, SECONDARY_TEXT, TERTIARY_BLUE } from '../../../constants';
import { MessageMsgNewCollection, MessageMsgTransferBadge } from 'bitbadgesjs-transactions';
import { BalanceBeforeAndAfter } from '../../common/BalanceBeforeAndAfter';
import { BadgeMetadata, BitBadgeCollection, BitBadgesUserInfo, IdRange, UserBalance } from '../../../bitbadges-api/types';
import { TransferDisplay } from '../../common/TransferDisplay';
import { getPostTransferBalance } from '../../../bitbadges-api/balances';
import { useChainContext } from '../../../chain/ChainContext';
import { AddressListSelect } from '../../address/AddressListSelect';
import { getAccountInformation } from '../../../bitbadges-api/api';
import { AddressDisplay } from '../../address/AddressDisplay';
import MerkleTree from 'merkletreejs';
import { SHA256 } from 'crypto-js';
import { AddressSelect } from '../../address/AddressSelect';
import { BadgeAvatarDisplay } from '../../badges/BadgeAvatarDisplay';
import { GetPermissions } from '../../../bitbadges-api/permissions';
import { BalanceDisplay } from '../../common/BalanceDisplay';
import { TableRow } from '../../common/TableRow';
import saveAs from 'file-saver';

const crypto = require('crypto');

const { Step } = Steps;


function downloadJson(json: object, filename: string) {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    saveAs(blob, filename);
}

enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,
}

export interface LeafItem {
    addressOrCode: string;
    fullCode: string;
    amount: number;
    badgeIds: IdRange[];
}

export function ManualTransfers({
    newBadgeMsg,
    setNewBadgeMsg,
    distributionMethod,
    setLeaves,
    collectionMetadata,
    setCollectionMetadata,
    individualBadgeMetadata,
    setIndividualBadgeMetadata,
}: {
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    distributionMethod: DistributionMethod;
    setLeaves: (leaves: string[]) => void;
    collectionMetadata: BadgeMetadata;
    setCollectionMetadata: (metadata: BadgeMetadata) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
}) {
    const chain = useChainContext();

    const badgeCollection: BitBadgeCollection = {
        ...newBadgeMsg,
        collectionId: 0,
        manager: {
            chain: chain.chain,
            accountNumber: chain.accountNumber,
            address: chain.address,
            cosmosAddress: chain.cosmosAddress,
        },
        nextBadgeId: newBadgeMsg.badgeSupplys[0].amount - 1,
        badgeMetadata: individualBadgeMetadata,
        collectionMetadata: collectionMetadata,
        unmintedSupplys: [],
        maxSupplys: [],
        permissions: GetPermissions(newBadgeMsg.permissions),
        disallowedTransfers: [],
        managerApprovedTransfers: [],
        claims: [],
    }

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

    const [currAddress, setCurrAddress] = useState<BitBadgesUserInfo>({} as BitBadgesUserInfo);
    const [amount, setAmount] = useState<number>(0);
    const [badgeRanges, setBadgeRanges] = useState<IdRange[]>([{ start: 0, end: 0 }]);

    const [leafs, setLeafs] = useState<LeafItem[]>([]);

    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    const addCode = () => {
        let currLeafItem = undefined;

        if (distributionMethod === DistributionMethod.Codes) {
            currLeafItem = {
                addressOrCode: crypto.randomBytes(32).toString('hex'),
                amount: amount,
                badgeIds: badgeRanges,
                fullCode: ""
            }
            // } else if (distributionMethod === DistributionMethod.SpecificAddresses) {
        } else {
            currLeafItem = {
                addressOrCode: currAddress.cosmosAddress,
                amount: amount,
                badgeIds: badgeRanges,
                fullCode: '',
            }
        }

        let fullCode: string = '';
        if (distributionMethod === DistributionMethod.Codes) {
            fullCode = currLeafItem.addressOrCode + '--';
        } else if (distributionMethod === DistributionMethod.SpecificAddresses) {
            fullCode = "-" + currLeafItem.addressOrCode + "-";
        }
        fullCode += currLeafItem.amount + "-" + currLeafItem.badgeIds[0]?.start + "-" + currLeafItem.badgeIds[0]?.end;
        currLeafItem.fullCode = fullCode;

        const newLeafs = distributionMethod === DistributionMethod.Codes ? [...leafs, currLeafItem, currLeafItem] : [...leafs, currLeafItem];
        setLeafs(newLeafs);

        const newLeaves = newLeafs.map(x => {
            return x.fullCode;
        });

        setLeaves(newLeaves);

        const hashes = newLeaves.map(x => {
            return SHA256(x)
        });

        const tree = new MerkleTree(hashes, SHA256)
        const root = tree.getRoot().toString('hex')

        const balance = {
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


        if (distributionMethod === DistributionMethod.Codes) {
            for (let i = 0; i < newLeafs.length; i += 2) {
                const leaf = newLeafs[i];
                const newBalance = getPostTransferBalance(balance, undefined, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
                balance.balances = newBalance.balances;
            }
        } else if (distributionMethod === DistributionMethod.SpecificAddresses) {
            for (let i = 0; i < newLeafs.length; i++) {
                const leaf = newLeafs[i];
                const newBalance = getPostTransferBalance(balance, leaf.addressOrCode, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
                balance.balances = newBalance.balances;
            }
        }

        const claimBalance = {
            balances: [
                {
                    balance: newBadgeMsg.badgeSupplys[0].supply,
                    badgeIds: [{
                        start: 0,
                        end: newBadgeMsg.badgeSupplys[0].amount - 1,
                    }]
                }
            ], approvals: []
        };

        for (const balanceObj of balance.balances) {
            for (const badgeId of balanceObj.badgeIds) {
                const newBalance = getPostTransferBalance(claimBalance, undefined, badgeId.start, badgeId.end, balanceObj.balance, 1);
                claimBalance.balances = newBalance.balances;
            }
        }

        setNewBadgeMsg({
            ...newBadgeMsg,
            claims: [
                {
                    amountPerClaim: 0,
                    balances: claimBalance.balances,
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

        setNewBalances(balance);
    }

    const nonFungible = newBadgeMsg.badgeSupplys[0].amount > 1;

    const postCurrBalance = getPostTransferBalance(JSON.parse(JSON.stringify(newBalances)), undefined, startBadgeId, endBadgeId, amountToTransfer, 1)

    return <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
        <Divider />
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>

            <div style={{ width: '50%' }}>
                <h2>Created Claims</h2>
                <p>
                    IMPORTANT: You are responsible for storing and distributing the codes you create!
                </p>
                <button
                    style={{
                        backgroundColor: 'inherit',
                        color: SECONDARY_TEXT,
                    }}
                    onClick={() => {
                        const today = new Date();

                        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                        const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                        downloadJson({
                            "claims": leafs,
                        }, `claimCodes-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                    }}
                    className="opacity link-button"
                >
                    Click here to download the codes!
                </button>
                <Divider />

                {leafs.map((leaf, index) => {
                    if (distributionMethod === DistributionMethod.Codes) {
                        if (index % 2 === 0) {
                            return <></>
                        }
                    }

                    return <div key={index} style={{ color: PRIMARY_TEXT }}>
                        <TransferDisplay
                            badge={badgeCollection}
                            setBadgeCollection={() => { }}
                            fontColor={PRIMARY_TEXT}
                            from={[
                                MINT_ACCOUNT
                            ]}
                            to={distributionMethod === DistributionMethod.SpecificAddresses ?
                                [
                                    {
                                        cosmosAddress: leaf.addressOrCode,
                                        accountNumber: -1,
                                        address: leaf.addressOrCode,
                                        chain: ''
                                    }
                                ] : []}
                            toCodes={distributionMethod === DistributionMethod.Codes ? [leaf.fullCode] : [

                            ]}
                            amount={leaf.amount}
                            startId={leaf.badgeIds[0]?.start}
                            endId={leaf.badgeIds[0]?.end}
                        />
                        <Divider />
                        {/* <p>x{leaf.amount} of badges with IDs from {leaf.badgeIds[0]?.start} to {leaf.badgeIds[0]?.end} can be claimed{" "}
                            {distributionMethod === DistributionMethod.SpecificAddresses ?
                                'by the address ' + leaf.addressOrCode : 'with the code ' + leaf.addressOrCode}
                        </p> */}
                    </div>
                })}
            </div>
            <div style={{ width: '50%' }}>
                <h2>Leftover Badges</h2>
                <p>Any badges leftover will remain unminted and can be put up for claim in the future!</p>
                <BalanceDisplay
                    message='Leftover Balances'
                    balance={newBalances}
                />
            </div>
        </div>
        <hr />


        {/* <BalanceBeforeAndAfter
            hideTitle
            balance={newBalances}
            newBalance={postCurrBalance} partyString='Unminted'
            beforeMessage='Undistributed Badges'
            afterMessage={`Undistributed Badges (After Current ${distributionMethod === DistributionMethod.SpecificAddresses ? 'Transfer' : 'Code'})`}
        /> */}

        {newBalances && newBalances.balances.length > 0 ?
            <div style={{}}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h2>Create New Claim?</h2>
                </div>
                {distributionMethod === DistributionMethod.SpecificAddresses && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ minWidth: 500 }} >
                        <AddressSelect
                            fontColor={PRIMARY_TEXT}
                            title='Select Recipient'
                            onChange={(address: BitBadgesUserInfo) => {
                                setCurrAddress(address);
                            }}
                        />
                    </div>
                </div>}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'column', margin: 20 }}>
                        <div>
                            Amount
                        </div>
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
                    {nonFungible && <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'column', margin: 20 }}
                        >
                            <div>
                                Badge ID Start
                            </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'column', margin: 20 }}
                        >
                            <div>
                                Badge ID End
                            </div>

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
                    </>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <b>Badges</b>
                </div>
                <BadgeAvatarDisplay
                    badgeCollection={badgeCollection} setBadgeCollection={() => { }} startId={startBadgeId} endId={endBadgeId} userBalance={{} as UserBalance} />


                <BalanceDisplay
                    message='Undistributed Badges After Claim'
                    balance={postCurrBalance}
                />

                <Button
                    type='primary'
                    style={{ width: '100%' }}
                    onClick={() => {
                        addCode();
                        setAmountToTransfer(0);
                    }}
                    disabled={amountToTransfer <= 0 || startBadgeId < 0 || endBadgeId < 0 || startBadgeId > endBadgeId || !!postCurrBalance.balances.find((balance) => balance.balance < 0) || (distributionMethod === DistributionMethod.SpecificAddresses && !currAddress.cosmosAddress)}
                >
                    {distributionMethod === DistributionMethod.SpecificAddresses ? 'Generate Claim (by Address)' : 'Generate Claim (by Code)'}
                </Button>
            </div>
            : <></>}



    </div>
}