import React, { useEffect, useState } from 'react';
import { InputNumber, Button, Divider, Collapse, Typography, Tooltip } from 'antd';
import { MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE, SECONDARY_TEXT, TERTIARY_BLUE } from '../../../constants';
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
import { createCollectionFromMsgNewCollection, getFullBadgeIdRanges } from '../../../bitbadges-api/badges';
import { downloadJson } from '../../../utils/downloadJson';
import { BalancesInput } from '../../common/BalancesInput';
import { BalanceBeforeAndAfter } from '../../common/BalanceBeforeAndAfter';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { DeleteOutlined } from '@ant-design/icons';
import { AddressDisplay } from '../../address/AddressDisplay';

const crypto = require('crypto');

const { Text } = Typography;

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
    collection: BitBadgeCollection;
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

    const [currBalances, setCurrBalances] = useState<Balance[]>([
        {
            balance: 1,
            badgeIds: getFullBadgeIdRanges(collection),
        },
    ]);

    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({} as BitBadgesUserInfo);

    const [showCreate, setShowCreate] = useState<boolean>(false);

    const calculateNewBalances = (newClaimItems: ClaimItem[]) => {
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

    const addCode = () => {
        let currLeafItem = undefined;
        if (distributionMethod === DistributionMethod.Codes) {
            currLeafItem = createClaim(crypto.randomBytes(32).toString('hex'), '', currBalances[0]?.balance, currBalances[0]?.badgeIds, currUserInfo.accountNumber, currUserInfo);
        } else {
            currLeafItem = createClaim('', currUserInfo.cosmosAddress, currBalances[0]?.balance, currBalances[0]?.badgeIds, currUserInfo.accountNumber, currUserInfo);
        }

        // For codes, we add twice so that the same code can be both children in a Merkle tree node
        // This is so that if a user knows a code, they can prove that they know the code without needing to know an alternative code
        const newClaimItems = distributionMethod === DistributionMethod.Codes ? [...claimItems, currLeafItem, currLeafItem] : [...claimItems, currLeafItem];

        calculateNewBalances(newClaimItems);
    }

    const nonFungible = newCollectionMsg.badgeSupplys[0]?.amount - 1 ? newCollectionMsg.badgeSupplys[0].amount - 1 : badgeCollection.nextBadgeId - 1 > 1;

    const postCurrBalance = getPostTransferBalance(JSON.parse(JSON.stringify(newBalances)), currBalances[0]?.badgeIds[0]?.start, currBalances[0]?.badgeIds[0]?.end, currBalances[0]?.balance, 1)


    return <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center', color: PRIMARY_TEXT, justifyContent: 'center', display: 'flex', width: 800 }}>

            {!showCreate && <div style={{ width: '100%' }}>

                {distributionMethod === DistributionMethod.Codes && <div> <p>
                    You are responsible for storing and distributing the generated codes!
                </p>
                    {/* <button
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
                        Click here to download the list of all codes!
                    </button> */}
                </div>}
                <br />
                {claimItems.length === 0 && <p>No claims have been created yet!</p>}
                {claimItems.length > 0 && <Collapse accordion style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                    {claimItems.map((leaf, index) => {
                        let currIndex = index;
                        if (distributionMethod === DistributionMethod.Codes) {
                            if (index % 2 === 1) {
                                return <></>
                            }

                            currIndex = index / 2;
                        }


                        return <CollapsePanel header={<div style={{ color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                {'#' + currIndex + ' ('}
                                {distributionMethod === DistributionMethod.Codes ? <Text copyable style={{ color: PRIMARY_TEXT }}>
                                    {'Code: ' + leaf.fullCode}</Text> :
                                    <>
                                        <AddressDisplay userInfo={leaf.userInfo} fontColor={PRIMARY_TEXT} fontSize={14} />
                                    </>
                                }
                                {')'}
                            </div>
                            <div>
                                <Tooltip title='Delete Claim'>

                                    <DeleteOutlined onClick={
                                        () => {
                                            if (distributionMethod === DistributionMethod.Codes) {
                                                const newClaimItems = claimItems.filter((_, i) => i !== index && i !== index + 1);
                                                calculateNewBalances(newClaimItems);

                                            } else {
                                                const newClaimItems = claimItems.filter((_, i) => i !== index);
                                                calculateNewBalances(newClaimItems);
                                            }
                                        }
                                    } />
                                </Tooltip>
                            </div>
                        </div>}
                            key={index} style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                            <div style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                                {/* <hr /> */}
                                {/* <h3>Claim #{currIndex + 1}</h3> */}
                                <TransferDisplay
                                    badge={badgeCollection}
                                    setBadgeCollection={() => { }}
                                    fontColor={PRIMARY_TEXT}
                                    from={[
                                        MINT_ACCOUNT
                                    ]}
                                    to={distributionMethod === DistributionMethod.SpecificAddresses ?
                                        [
                                            leaf.userInfo
                                        ] : []}
                                    toCodes={distributionMethod === DistributionMethod.Codes ? [leaf.fullCode] : [

                                    ]}
                                    amount={leaf.amount}
                                    badgeIds={leaf.badgeIds}
                                />

                                <Divider />
                            </div>
                        </CollapsePanel>
                    })}
                </Collapse>}

                <Divider />
                <hr />
                <br />

                {newBalances && <BalanceDisplay message='Undistributed Badges' collection={badgeCollection} setCollection={() => { }} balance={newBalances} />}
                <br />
                {newBalances?.balances.length > 0 &&
                    <Button type="primary" onClick={() => setShowCreate(true)} disabled={newBalances?.balances.length === 0}>Create New Claim</Button>}

                <Divider />
                <br />
            </div>}
            {showCreate && <div style={{ width: '100%' }}>




                {newBalances && newBalances.balances.length > 0 ?
                    <div style={{}}>
                        {/* <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <h2>New Claim</h2>
                        </div> */}
                        {distributionMethod === DistributionMethod.SpecificAddresses && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ minWidth: 500 }} >
                                <AddressSelect
                                    fontColor={PRIMARY_TEXT}
                                    title='Select Recipient'
                                    currUserInfo={currUserInfo}
                                    setCurrUserInfo={setCurrUserInfo}
                                    darkMode
                                />
                            </div>
                        </div>}
                        <br />
                        <BalancesInput darkMode collection={collection} balances={currBalances} setBalances={setCurrBalances} />
                        <br />
                        <TransferDisplay
                            badge={badgeCollection}
                            setBadgeCollection={() => { }}
                            fontColor={PRIMARY_TEXT}
                            from={[
                                MINT_ACCOUNT
                            ]}
                            to={distributionMethod === DistributionMethod.SpecificAddresses ?
                                [
                                    currUserInfo
                                ] : []}
                            toCodes={distributionMethod === DistributionMethod.Codes ? ['User Who Enters Code'] : [

                            ]}
                            amount={currBalances[0]?.balance}
                            badgeIds={currBalances[0]?.badgeIds}
                        />
                        <Divider />
                        <hr />
                        {newBalances && <BalanceBeforeAndAfter collection={badgeCollection} balance={newBalances} newBalance={postCurrBalance} partyString='Undistributed' beforeMessage='Before Claim' afterMessage='After Claim' />}
                        {/* <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div style={{ width: '48%' }}>

                            <BalanceDisplay
                                message='Badges for New Claim'
                                balance={{
                                    approvals: [],
                                    balances: [
                                        {
                                            balance: currBalances[0]?.balance,
                                            badgeIds: [
                                                {
                                                    start: currBalances[0]?.badgeIds[0]?.start,
                                                    end: currBalances[0]?.badgeIds[0]?.end
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
                    </div> */}
                        <br />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                                // type='primary'
                                style={{
                                    width: '48%',
                                    color: PRIMARY_TEXT,
                                    backgroundColor: TERTIARY_BLUE
                                }}
                                onClick={() => {

                                    setShowCreate(false);
                                }}

                            >
                                Cancel
                            </Button>
                            <Button
                                type='primary'
                                style={{ width: '48%' }}
                                onClick={() => {
                                    addCode();
                                    setCurrBalances([{
                                        balance: 1,
                                        badgeIds: getFullBadgeIdRanges(collection)
                                    }])
                                    setShowCreate(false);
                                }}
                                disabled={currBalances[0]?.balance <= 0 || currBalances[0]?.badgeIds[0]?.start < 0 || currBalances[0]?.badgeIds[0]?.end < 0 || currBalances[0]?.badgeIds[0]?.start > currBalances[0]?.badgeIds[0]?.end || !!postCurrBalance.balances.find((balance) => balance.balance < 0) || (distributionMethod === DistributionMethod.SpecificAddresses && !currUserInfo.cosmosAddress)}
                            >
                                {distributionMethod === DistributionMethod.SpecificAddresses ? 'Generate Claim (by Address)' : 'Generate Claim (by Code)'}
                            </Button>
                        </div>
                    </div>
                    : <></>}
            </div>
            }
        </div>
    </div>
}