import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, Divider, InputNumber, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { createCollectionFromMsgNewCollection, getFullBadgeIdRanges } from '../../../bitbadges-api/badges';
import { getBadgeSupplysFromMsgNewCollection, getPostTransferBalance } from '../../../bitbadges-api/balances';
import { createClaim, getClaimsValueFromClaimItems } from '../../../bitbadges-api/claims';
import { BadgeMetadata, Balance, BitBadgeCollection, BitBadgesUserInfo, ClaimItem, DistributionMethod, UserBalance } from '../../../bitbadges-api/types';
import { useChainContext } from '../../../chain/ChainContext';
import { MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { AddressDisplay } from '../../address/AddressDisplay';
import { AddressListSelect } from '../../address/AddressListSelect';
import { BalanceBeforeAndAfter } from '../../common/BalanceBeforeAndAfter';
import { BalanceDisplay } from '../../common/BalanceDisplay';
import { BalancesInput } from '../../common/BalancesInput';
import { TransferDisplay } from '../../common/TransferDisplay';

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
    individualBadgeMetadata,
    balancesToDistribute
}: {
    collection: BitBadgeCollection;
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    distributionMethod: DistributionMethod;
    claimItems: ClaimItem[];
    setClaimItems: (leaves: ClaimItem[]) => void;
    collectionMetadata: BadgeMetadata;
    individualBadgeMetadata: { [badgeId: string]: BadgeMetadata };
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

    const [users, setUsers] = useState<BitBadgesUserInfo[]>([]);
    const [numCodes, setNumCodes] = useState<number>(1);


    const calculateNewBalances = (newClaimItems: ClaimItem[]) => {
        const balance = balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : getBadgeSupplysFromMsgNewCollection(newCollectionMsg)

        const claimRes = getClaimsValueFromClaimItems(balance, newClaimItems, distributionMethod);

        setNewCollectionMsg({
            ...newCollectionMsg,
            claims: claimRes.claims,
        })
        setNewBalances(claimRes.balance);
        setClaimItems(newClaimItems);
    }

    const addCode = () => {
        let leafItemsToAdd = [];

        if (distributionMethod === DistributionMethod.Codes) {
            for (let i = 0; i < numCodes; i++) {
                leafItemsToAdd.push(createClaim(crypto.randomBytes(32).toString('hex'), '', currBalances[0]?.balance, currBalances[0]?.badgeIds, -1, {} as BitBadgesUserInfo));
            }
        } else {
            for (const userInfo of users) {
                leafItemsToAdd.push(createClaim('', userInfo.cosmosAddress, currBalances[0]?.balance, currBalances[0]?.badgeIds, userInfo.accountNumber, userInfo));
            }
        }

        // For codes, we add twice so that the same code can be both children in a Merkle tree node
        // This is so that if a user knows a code, they can prove that they know the code without needing to know an alternative code
        const newClaimItems = claimItems;
        if (distributionMethod === DistributionMethod.Codes) {
            for (const leafItem of leafItemsToAdd) {
                newClaimItems.push(leafItem, leafItem);
            }
        } else {
            for (const leafItem of leafItemsToAdd) {
                newClaimItems.push(leafItem);
            }
        }

        calculateNewBalances(newClaimItems);
    }

    const nonFungible = newCollectionMsg.badgeSupplys[0]?.amount - 1 ? newCollectionMsg.badgeSupplys[0].amount - 1 : badgeCollection.nextBadgeId - 1 > 1;

    const postCurrBalance = getPostTransferBalance(JSON.parse(JSON.stringify(newBalances)), currBalances[0]?.badgeIds[0]?.start, currBalances[0]?.badgeIds[0]?.end, currBalances[0]?.balance, 1)


    return <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center', color: PRIMARY_TEXT, justifyContent: 'center', display: 'flex', width: 800 }}>

            <div style={{ width: '100%' }}>
                {newBalances?.balances?.length > 0 && <BalanceDisplay message='Undistributed Badges' collection={badgeCollection} balance={newBalances} updateCollectionMetadata={() => { }} />}

                {/* <Divider /> */}

                {claimItems.length > 0 && <><br /><h3>Created Claims</h3><Collapse accordion style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>

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
                                {distributionMethod === DistributionMethod.Codes ? <Text copyable style={{ color: PRIMARY_TEXT }}>
                                    {'Code: ' + leaf.fullCode}</Text> :
                                    <>
                                        <AddressDisplay userInfo={leaf.userInfo} fontColor={PRIMARY_TEXT} fontSize={14} />
                                    </>
                                }
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
                                    updateCollectionMetadata={() => { }}
                                    collection={badgeCollection}
                                    fontColor={PRIMARY_TEXT}
                                    from={[
                                        MINT_ACCOUNT
                                    ]}
                                    to={distributionMethod === DistributionMethod.Whitelist ?
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
                </Collapse>
                    <Divider />
                </>}





                <br />
                <Collapse accordion style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                    <CollapsePanel key='create' header={<div style={{ color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>Create New Claim?</div>
                        <PlusOutlined />
                    </div>}
                        style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>

                        {newBalances?.balances.length === 0 ? <h2>No badges left to distribute!</h2> : <h2>Create New Claim</h2>}


                        {newBalances && newBalances.balances.length > 0 ?
                            <div style={{ color: PRIMARY_TEXT }}>

                                {distributionMethod === DistributionMethod.Whitelist && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <div style={{ minWidth: 500 }} >
                                        <AddressListSelect
                                            users={users}
                                            setUsers={setUsers}
                                            darkMode
                                        />
                                        <hr />
                                    </div>
                                </div>}

                                {distributionMethod === DistributionMethod.Codes && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <div style={{ minWidth: 500 }} >
                                        <div className='flex-between' style={{ flexDirection: 'column' }} >
                                            <b>Number of Codes to Generate</b>
                                            <InputNumber
                                                min={1}
                                                value={numCodes}
                                                onChange={(value) => {
                                                    setNumCodes(value);
                                                }}
                                                style={{
                                                    backgroundColor: PRIMARY_BLUE,
                                                    color: PRIMARY_TEXT,
                                                }}
                                            />
                                        </div>

                                    </div>
                                </div>}
                                <br />
                                <BalancesInput darkMode collection={collection} balances={currBalances} setBalances={setCurrBalances} />
                                <br />
                                <TransferDisplay
                                    updateCollectionMetadata={() => { }}
                                    collection={badgeCollection}

                                    fontColor={PRIMARY_TEXT}
                                    from={[
                                        MINT_ACCOUNT
                                    ]}
                                    to={distributionMethod === DistributionMethod.Whitelist ?
                                        [
                                            ...users
                                        ] : []}
                                    toCodes={distributionMethod === DistributionMethod.Codes ? new Array(numCodes).fill('First User to Enter Code') : [

                                    ]}
                                    amount={currBalances[0]?.balance}
                                    badgeIds={currBalances[0]?.badgeIds}
                                />
                                <Divider />
                                <hr />
                                {newBalances && <BalanceBeforeAndAfter updateCollectionMetadata={() => { }} collection={badgeCollection} balance={newBalances} newBalance={postCurrBalance} partyString='Undistributed' beforeMessage='Before Claim' afterMessage='After Claim' />}

                                <br />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                                    <Button
                                        type='primary'
                                        style={{ width: '100%' }}
                                        onClick={() => {
                                            addCode();
                                            setCurrBalances([{
                                                balance: 1,
                                                badgeIds: getFullBadgeIdRanges(collection)
                                            }])

                                        }}
                                        disabled={currBalances[0]?.balance <= 0 || currBalances[0]?.badgeIds[0]?.start < 0 || currBalances[0]?.badgeIds[0]?.end < 0 || currBalances[0]?.badgeIds[0]?.start > currBalances[0]?.badgeIds[0]?.end || !!postCurrBalance.balances.find((balance) => balance.balance < 0) || (distributionMethod === DistributionMethod.Whitelist && !!users.find((x) => !x.cosmosAddress))}
                                    >
                                        {distributionMethod === DistributionMethod.Whitelist ? 'Generate Claim (by Address)' : 'Generate Claim (by Code)'}
                                    </Button>
                                </div>
                            </div> : <></>
                        }
                    </CollapsePanel>
                </Collapse>
            </div>
        </div >
    </div >
}