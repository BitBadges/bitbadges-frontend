import { DeleteOutlined } from '@ant-design/icons';
import { Collapse, Divider, Empty, Pagination, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { createClaim, getClaimsValueFromClaimItems, getTransfersFromClaimItems } from '../../../bitbadges-api/claims';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, ClaimItem, DistributionMethod, Transfers, UserBalance } from '../../../bitbadges-api/types';
import { DEV_MODE, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { AddressDisplay } from '../../address/AddressDisplay';
import { BalanceDisplay } from '../../balances/BalanceDisplay';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { TransferDisplay } from '../../transfers/TransferDisplay';
import { TransferSelect } from '../../transfers/TransferSelect';
import MerkleTree from 'merkletreejs';
import { SHA256 } from 'crypto-js';
import { useAccountsContext } from '../../../contexts/AccountsContext';

const crypto = require('crypto');

const { Text } = Typography;

export function CreateClaims({
    collection,
    newCollectionMsg,
    setNewCollectionMsg,
    distributionMethod,
    claimItems,
    setClaimItems,
    balancesToDistribute
}: {
    collection: BitBadgeCollection;
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    distributionMethod: DistributionMethod;
    claimItems: ClaimItem[];
    setClaimItems: (leaves: ClaimItem[]) => void;
    balancesToDistribute?: Balance[];
}) {
    const badgeCollection = collection;

    const accounts = useAccountsContext();

    const [currPage, setCurrPage] = useState(1);
    const [claimBalances, setClaimBalances] = useState<UserBalance>(
        balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : {
            balances: JSON.parse(JSON.stringify(badgeCollection.unmintedSupplys)),
            approvals: []
        });

    const [transfers, setTransfers] = useState<(Transfers & { toAddressInfo: (BitBadgesUserInfo | undefined)[] })[]>(claimItems ?
        getTransfersFromClaimItems(claimItems, accounts) : []
    );

    const setTransfersHandler = (newTransfers: (Transfers & { toAddressInfo: (BitBadgesUserInfo | undefined)[] })[]) => {
        setTransfers(newTransfers);
        addCode(newTransfers);
    }

    const calculateNewBalances = (newClaimItems: ClaimItem[]) => {
        const balance = balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : {
            balances: JSON.parse(JSON.stringify(badgeCollection.unmintedSupplys)),
            approvals: []
        };

        const claimRes = getClaimsValueFromClaimItems(balance, newClaimItems, distributionMethod);

        setNewCollectionMsg({
            ...newCollectionMsg,
            claims: claimRes.claims,
        })
        setClaimBalances(claimRes.balance);
        setClaimItems(newClaimItems);
    }

    const addCode = (newTransfers: (Transfers & { toAddressInfo: (BitBadgesUserInfo | undefined)[] })[]) => {
        let leafItemsToAdd = [];

        if (distributionMethod === DistributionMethod.Codes) {
            for (const transfer of newTransfers) {
                for (let i = 0; i < transfer.toAddresses.length; i++) {
                    const code = crypto.randomBytes(32).toString('hex')
                    const codeTree = new MerkleTree(['1-' + code].map(x => SHA256(x)), SHA256);
                    leafItemsToAdd.push({
                        ...createClaim(codeTree.getRoot().toString('hex'), '', transfer.balances[0]?.balance, 0, transfer.balances[0]?.badgeIds),
                        addresses: [],
                        codes: ['1-' + code],
                        codeTree: codeTree,
                        addressesTree: new MerkleTree([]),
                    });
                }
            }
        } else {
            for (const transfer of newTransfers) {
                for (let i = 0; i < transfer.toAddresses.length; i++) {
                    const userInfo = transfer.toAddressInfo[i];
                    if (userInfo) {
                        const addressesTree = new MerkleTree(['1-' + userInfo.cosmosAddress].map(x => SHA256(x)), SHA256);
                        leafItemsToAdd.push({
                            ...createClaim('', addressesTree.getRoot().toString('hex'), transfer.balances[0]?.balance, 0, transfer.balances[0]?.badgeIds),
                            addresses: ['1-' + userInfo.cosmosAddress],
                            codes: [],
                            codeTree: new MerkleTree([]),
                            addressesTree: addressesTree
                        });
                    }
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
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }} >
                                    <Pagination
                                        style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT, margin: 10 }}
                                        current={currPage}
                                        total={claimItems.length}
                                        pageSize={distributionMethod == DistributionMethod.Codes ? 20 : 10}
                                        onChange={(page) => {
                                            setCurrPage(page);
                                        }}
                                        hideOnSinglePage
                                        showSizeChanger={false}
                                        defaultCurrent={1}
                                    />
                                </div>
                                <Collapse accordion style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, margin: 0 }}>

                                    {claimItems.map((leaf, index) => {
                                        if (index < (currPage - 1) * (distributionMethod === DistributionMethod.Codes ? 20 : 10) || index >= currPage * (distributionMethod === DistributionMethod.Codes ? 20 : 10)) {
                                            return <></>
                                        }


                                        let currIndex = index;

                                        if (distributionMethod === DistributionMethod.Codes) {
                                            if (index % 2 === 1) {
                                                return <></>
                                            }

                                            currIndex = index / 2;
                                        }

                                        return <CollapsePanel header={<div style={{ margin: 0, color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>


                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                                {distributionMethod === DistributionMethod.Codes ? <Text strong style={{ color: PRIMARY_TEXT }}>
                                                    {`Code #${currIndex + 1}`}
                                                </Text> :
                                                    <>
                                                        {leaf.addresses.map(addr => {
                                                            const res = addr.split('-');
                                                            const cosmosAddr = res[1]
                                                            return <AddressDisplay key={addr} userInfo={accounts.accounts[cosmosAddr]} fontColor={PRIMARY_TEXT} fontSize={14} />
                                                        })}
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
                                                            toAddresses: distributionMethod === DistributionMethod.Whitelist ? leaf.addresses.map(addr => {
                                                                const res = addr.split('-');
                                                                const cosmosAddr = res[1]
                                                                return accounts.accounts[cosmosAddr].accountNumber
                                                            }) : [],
                                                            balances: [
                                                                {
                                                                    balance: leaf.amount,
                                                                    badgeIds: leaf.badgeIds
                                                                }
                                                            ],
                                                            toAddressInfo: leaf.addresses.map(addr => {
                                                                const res = addr.split('-');
                                                                const cosmosAddr = res[1]
                                                                return accounts.accounts[cosmosAddr]
                                                            })
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
                    } : {
                        balances: JSON.parse(JSON.stringify(badgeCollection.unmintedSupplys)),
                        approvals: []
                    }}
                    distributionMethod={distributionMethod}
                    sender={MINT_ACCOUNT}
                    collection={badgeCollection}
                    hideTransferDisplay={true}
                    isWhitelist
                />
            </div>
        </div>
        {DEV_MODE && <pre
            style={{
                color: 'white',
                backgroundColor: 'black',
                padding: 10,
            }}
        >
            {JSON.stringify(claimItems, null, 2)}
        </pre>}
    </div>
}