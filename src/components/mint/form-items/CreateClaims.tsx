import { Collapse, Divider, Empty, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { createCollectionFromMsgNewCollection } from '../../../bitbadges-api/badges';
import { getBadgeSupplysFromMsgNewCollection } from '../../../bitbadges-api/balances';
import { createClaim, getClaimsValueFromClaimItems } from '../../../bitbadges-api/claims';
import { BadgeMetadata, Balance, BitBadgeCollection, BitBadgesUserInfo, ClaimItem, DistributionMethod, Transfers, UserBalance } from '../../../bitbadges-api/types';
import { useChainContext } from '../../../chain/ChainContext';
import { MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { AddressDisplay } from '../../address/AddressDisplay';
import { BalanceDisplay } from '../../common/BalanceDisplay';
import { InformationDisplayCard } from '../../common/InformationDisplayCard';
import { TransferDisplay } from '../../common/TransferDisplay';
import { TransferSelect } from '../../common/TransferSelect';
import { DeleteOutlined } from '@ant-design/icons';

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


    const [claimBalances, setClaimBalances] = useState<UserBalance>(
        balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : getBadgeSupplysFromMsgNewCollection(newCollectionMsg));

    const [transfers, setTransfers] = useState<(Transfers & { toAddressInfo: BitBadgesUserInfo[] })[]>(claimItems ?
        claimItems.map((x) => ({
            toAddresses: [x.accountNum],
            balances: [
                {
                    balance: x.amount,
                    badgeIds: x.badgeIds,
                }
            ],
            toAddressInfo: [x.userInfo],
        })) : []
    );

    const setTransfersHandler = (newTransfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[]) => {
        setTransfers(newTransfers);
        addCode(newTransfers);
    }



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
        setClaimBalances(claimRes.balance);
        setClaimItems(newClaimItems);
    }

    const addCode = (newTransfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[]) => {
        let leafItemsToAdd = [];


        if (distributionMethod === DistributionMethod.Codes) {
            for (const transfer of newTransfers) {
                for (let i = 0; i < transfer.toAddresses.length; i++) {
                    leafItemsToAdd.push(createClaim(crypto.randomBytes(32).toString('hex'), '', transfer.balances[0]?.balance, transfer.balances[0]?.badgeIds, -1, {} as BitBadgesUserInfo));
                }
            }


        } else {
            for (const transfer of newTransfers) {
                for (let i = 0; i < transfer.toAddresses.length; i++) {
                    const userInfo = transfer.toAddressInfo[i];
                    leafItemsToAdd.push(createClaim('', userInfo.cosmosAddress, transfer.balances[0]?.balance, transfer.balances[0]?.badgeIds, userInfo.accountNumber, userInfo));
                }
            }
        }

        // For codes, we add twice so that the same code can be both children in a Merkle tree node
        // This is so that if a user knows a code, they can prove that they know the code without needing to know an alternative code
        const newClaimItems = [];
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

    return <div style={{ justifyContent: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center', color: PRIMARY_TEXT, justifyContent: 'center', display: 'flex', width: '100%' }}>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '48%', display: 'flex' }}>
                    <InformationDisplayCard
                        title='Undistributed Badges'
                    >
                        {claimBalances.balances.length > 0 && <BalanceDisplay
                            size={40}
                            collection={badgeCollection} balance={claimBalances}
                        />}
                        {claimBalances.balances.length === 0 && <Empty
                            style={{ color: PRIMARY_TEXT }}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description='No badges to distribute.' />}
                    </InformationDisplayCard>
                </div>
                <div style={{ width: '48%', display: 'flex' }}>
                    <InformationDisplayCard
                        title={distributionMethod === DistributionMethod.Codes ? 'Codes' : 'Whitelist'}
                    ><>
                            {claimItems.length === 0 && <Empty
                                style={{ color: PRIMARY_TEXT }}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={distributionMethod === DistributionMethod.Codes ? 'No codes generated.' : 'No users added.'} />}

                            {claimItems.length > 0 && <>
                                <Collapse accordion style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, margin: 0 }}>
                                    {claimItems.map((leaf, index) => {
                                        let currIndex = index;
                                        if (distributionMethod === DistributionMethod.Codes) {
                                            if (index % 2 === 1) {
                                                return <></>
                                            }

                                            currIndex = index / 2;
                                        }

                                        return <CollapsePanel header={<div style={{ margin: 0, color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                                {distributionMethod === DistributionMethod.Codes ? <Text copyable style={{ color: PRIMARY_TEXT }}>
                                                    {`Code #${currIndex + 1}`}
                                                </Text> :
                                                    <>
                                                        <AddressDisplay userInfo={leaf.userInfo} fontColor={PRIMARY_TEXT} fontSize={14} />
                                                    </>
                                                }
                                            </div>
                                            <div>
                                                <Tooltip title='Delete'>

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
                                                {distributionMethod === DistributionMethod.Codes ? <>
                                                    <Text strong style={{ color: PRIMARY_TEXT, fontSize: 16 }}>
                                                        Code
                                                    </Text>
                                                    <br />
                                                    <Text copyable strong style={{ color: PRIMARY_TEXT, fontSize: 16, }}>
                                                        {leaf.fullCode}
                                                    </Text>
                                                    <Divider />
                                                </> :
                                                    <></>
                                                }
                                                <TransferDisplay
                                                    deletable
                                                    collection={badgeCollection}
                                                    fontColor={PRIMARY_TEXT}

                                                    from={[
                                                        MINT_ACCOUNT
                                                    ]}
                                                    setTransfers={setTransfersHandler}
                                                    transfers={[
                                                        {
                                                            toAddresses: distributionMethod === DistributionMethod.Whitelist ? [
                                                                leaf.userInfo.accountNumber
                                                            ] : [],
                                                            balances: [
                                                                {
                                                                    balance: leaf.amount,
                                                                    badgeIds: leaf.badgeIds
                                                                }
                                                            ],
                                                            toAddressInfo: [leaf.userInfo]
                                                        }
                                                    ]}
                                                    toCodes={distributionMethod === DistributionMethod.Codes ? [leaf.fullCode] : [

                                                    ]}
                                                />

                                                <Divider />
                                            </div>
                                        </CollapsePanel>
                                    })}
                                </Collapse>
                                <Divider />
                            </>}
                        </>
                    </InformationDisplayCard>
                </div>

            </div>

        </div >
        <br />
        <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <TransferSelect
                    transfers={transfers}
                    setTransfers={setTransfersHandler}
                    userBalance={balancesToDistribute ? {
                        balances: JSON.parse(JSON.stringify(balancesToDistribute)),
                        approvals: [],
                    } : getBadgeSupplysFromMsgNewCollection(newCollectionMsg)}
                    distributionMethod={distributionMethod}
                    fromUser={MINT_ACCOUNT}
                    collection={badgeCollection}
                    hideTransferDisplay={true}
                />
            </div>
        </div>
    </div>
}