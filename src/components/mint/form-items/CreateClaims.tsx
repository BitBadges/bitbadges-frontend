import React, { useEffect, useState } from 'react';
import { InputNumber, Button, Divider } from 'antd';
import { MINT_ACCOUNT, PRIMARY_TEXT, SECONDARY_TEXT, TERTIARY_BLUE } from '../../../constants';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { BadgeMetadata, Balance, BitBadgeCollection, BitBadgesUserInfo, ClaimItem, DistributionMethod, IdRange, UserBalance } from '../../../bitbadges-api/types';
import { TransferDisplay } from '../../common/TransferDisplay';
import { getBadgeSupplysFromMsgNewCollection, getPostTransferBalance } from '../../../bitbadges-api/balances';
import { useChainContext } from '../../../chain/ChainContext';
import MerkleTree from 'merkletreejs';
import { SHA256 } from 'crypto-js';
import { AddressSelect } from '../../address/AddressSelect';
import { BadgeAvatarDisplay } from '../../badges/BadgeAvatarDisplay';
import { BalanceDisplay } from '../../common/BalanceDisplay';
import { createClaim } from '../../../bitbadges-api/claims';
import { createCollectionFromMsgNewCollection } from '../../../bitbadges-api/badges';
import { downloadJson } from '../../../utils/downloadJson';

const crypto = require('crypto');


export function CreateClaims({
    collection,
    newCollectionMsg,
    setNewCollectionMsg,
    distributionMethod,
    claimItems,
    setClaimItems,
    collectionMetadata,
    setCollectionMetadata,
    individualBadgeMetadata,
    setIndividualBadgeMetadata,
    balancesToDistribute,
}: {
    collection?: BitBadgeCollection;
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    distributionMethod: DistributionMethod;
    claimItems: ClaimItem[];
    setClaimItems: (leaves: ClaimItem[]) => void;
    collectionMetadata: BadgeMetadata;
    setCollectionMetadata: (metadata: BadgeMetadata) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
    balancesToDistribute?: Balance[];
}) {
    const chain = useChainContext();
    const badgeCollection = createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain, collection);

    const [newBalances, setNewBalances] = useState<UserBalance>(
        balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : getBadgeSupplysFromMsgNewCollection(newCollectionMsg));

    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startBadgeId, setStartBadgeId] = useState<number>(0);
    const [endBadgeId, setEndBadgeId] = useState<number>(newCollectionMsg.badgeSupplys[0]?.amount - 1 ? newCollectionMsg.badgeSupplys[0].amount - 1 : badgeCollection.nextBadgeId - 1);

    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({} as BitBadgesUserInfo);
    const [amount, setAmount] = useState<number>(0);
    const [badgeRanges, setBadgeRanges] = useState<IdRange[]>([{ start: 0, end: 0 }]);



    const addCode = () => {
        let currLeafItem = undefined;
        if (distributionMethod === DistributionMethod.Codes) {
            currLeafItem = createClaim(crypto.randomBytes(32).toString('hex'), '', amount, badgeRanges, currUserInfo.accountNumber);
        } else {
            currLeafItem = createClaim('', currUserInfo.cosmosAddress, amount, badgeRanges, currUserInfo.accountNumber);
        }

        // For codes, we add twice so that the same code can be both children in a Merkle tree node
        // This is so that if a user knows a code, they can prove that they know the code without needing to know an alternative code
        const newClaimItems = distributionMethod === DistributionMethod.Codes ? [...claimItems, currLeafItem, currLeafItem] : [...claimItems, currLeafItem];

        const tree = new MerkleTree(newClaimItems.map((x) => SHA256(x.fullCode)), SHA256)
        const root = tree.getRoot().toString('hex')

        const balance = balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : getBadgeSupplysFromMsgNewCollection(newCollectionMsg)

        console.log("ORIG", balancesToDistribute)

        if (distributionMethod === DistributionMethod.Codes) {
            for (let i = 0; i < newClaimItems.length; i += 2) {
                const leaf = newClaimItems[i];
                const newBalance = getPostTransferBalance(balance, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
                balance.balances = newBalance.balances;
            }
        } else if (distributionMethod === DistributionMethod.SpecificAddresses) {
            for (let i = 0; i < newClaimItems.length; i++) {
                const leaf = newClaimItems[i];
                const newBalance = getPostTransferBalance(balance, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
                balance.balances = newBalance.balances;
            }
        }

        console.log("AFTER", balance);

        const claimBalance = balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : getBadgeSupplysFromMsgNewCollection(newCollectionMsg)

        for (const balanceObj of balance.balances) {
            for (const badgeId of balanceObj.badgeIds) {
                const newBalance = getPostTransferBalance(claimBalance, badgeId.start, badgeId.end, balanceObj.balance, 1);
                claimBalance.balances = newBalance.balances;
            }
        }

        setNewCollectionMsg({
            ...newCollectionMsg,
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
        setClaimItems(newClaimItems);
    }

    const nonFungible = newCollectionMsg.badgeSupplys[0]?.amount - 1 ? newCollectionMsg.badgeSupplys[0].amount - 1 : badgeCollection.nextBadgeId - 1 > 1;

    const postCurrBalance = getPostTransferBalance(JSON.parse(JSON.stringify(newBalances)), startBadgeId, endBadgeId, amountToTransfer, 1)

    return <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
        <Divider />
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '45%' }}>
                <h2>Undistributed Badges</h2>
                <p>Any badges leftover will remain unminted and can be put up for claim in the future!</p>
                <BalanceDisplay
                    collection={badgeCollection}
                    setCollection={(collection) => {
                        setCollectionMetadata(collection.collectionMetadata)
                        setIndividualBadgeMetadata(collection.badgeMetadata)
                    }}
                    message='Undistributed Badges'
                    balance={newBalances}
                />
            </div>
            <div style={{ width: '45%' }}>
                <h2>Distributed Badges</h2>
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
                            "claims": claimItems,
                        }, `claimCodes-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                    }}
                    className="opacity link-button"
                >
                    Click here to download the codes!
                </button>
                <Divider />

                {claimItems.map((leaf, index) => {
                    let currIndex = index;
                    if (distributionMethod === DistributionMethod.Codes) {
                        if (index % 2 === 1) {
                            return <></>
                        }

                        currIndex = index / 2;
                    }

                    return <div key={index} style={{ color: PRIMARY_TEXT }}>
                        <hr />
                        <h3>Claim #{currIndex + 1}</h3>
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
                                        cosmosAddress: leaf.address,
                                        accountNumber: -1,
                                        address: leaf.address,
                                        chain: ''
                                    }
                                ] : []}
                            toCodes={distributionMethod === DistributionMethod.Codes ? [leaf.fullCode] : [

                            ]}
                            amount={leaf.amount}
                            badgeIds={leaf.badgeIds}
                        />

                        <Divider />


                    </div>
                })}
            </div>

        </div>
        <hr />

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
                            currUserInfo={currUserInfo}
                            setCurrUserInfo={setCurrUserInfo}
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
                                max={newCollectionMsg.badgeSupplys[0]?.amount - 1 ? newCollectionMsg.badgeSupplys[0].amount - 1 : badgeCollection.nextBadgeId - 1}
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

                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div style={{ width: '48%' }}>

                        <BalanceDisplay
                            message='Badges for New Claim'
                            balance={{
                                approvals: [],
                                balances: [
                                    {
                                        balance: amountToTransfer,
                                        badgeIds: [
                                            {
                                                start: startBadgeId,
                                                end: endBadgeId
                                            }
                                        ]
                                    }
                                ]
                            }}
                            collection={badgeCollection}
                            setCollection={(collection) => {
                                setCollectionMetadata(collection.collectionMetadata)
                                setIndividualBadgeMetadata(collection.badgeMetadata)
                            }}
                        />
                    </div>
                    <div style={{ width: '48%' }}>
                        <BalanceDisplay
                            message='Undistributed Badges After New Claim'
                            balance={postCurrBalance}
                            collection={badgeCollection}
                            setCollection={(collection) => {
                                setCollectionMetadata(collection.collectionMetadata)
                                setIndividualBadgeMetadata(collection.badgeMetadata)
                            }}
                        />
                    </div>
                </div>

                <Button
                    type='primary'
                    style={{ width: '100%' }}
                    onClick={() => {
                        addCode();
                        setAmountToTransfer(0);
                    }}
                    disabled={amountToTransfer <= 0 || startBadgeId < 0 || endBadgeId < 0 || startBadgeId > endBadgeId || !!postCurrBalance.balances.find((balance) => balance.balance < 0) || (distributionMethod === DistributionMethod.SpecificAddresses && !currUserInfo.cosmosAddress)}
                >
                    {distributionMethod === DistributionMethod.SpecificAddresses ? 'Generate Claim (by Address)' : 'Generate Claim (by Code)'}
                </Button>
            </div>
            : <></>}



    </div>
}