import { DeleteOutlined } from '@ant-design/icons';
import { Collapse, Divider, Empty, Pagination, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { createClaim, getClaimsValueFromClaimItems, getTransfersFromClaimItems } from '../../../bitbadges-api/claims';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, ClaimItem, DistributionMethod, Transfers, UserBalance } from '../../../bitbadges-api/types';
import { DEV_MODE, GO_MAX_UINT_64, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
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
    setClaimItems: (claimItems: ClaimItem[]) => void;
    balancesToDistribute?: Balance[];
}) {
    const badgeCollection = collection;

    const accounts = useAccountsContext();

    const [currPage, setCurrPage] = useState(1);
    const [undistributedBalances, setUndistributedBalances] = useState<UserBalance>(
        balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : {
            balances: JSON.parse(JSON.stringify(badgeCollection.unmintedSupplys)),
            approvals: []
        });

    const [transfers, setTransfers] = useState<(Transfers & { toAddressInfo: (BitBadgesUserInfo | undefined)[], numCodes?: number })[]>(claimItems ?
        getTransfersFromClaimItems(claimItems, accounts) : []
    );

    const setTransfersHandler = (newTransfers: (Transfers & { toAddressInfo: (BitBadgesUserInfo | undefined)[], numCodes?: number })[]) => {
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

        const claimsRes = getClaimsValueFromClaimItems(balance, newClaimItems);

        setNewCollectionMsg({
            ...newCollectionMsg,
            claims: claimsRes.claims,
        })

        setUndistributedBalances(claimsRes.undistributedBalance);
        setClaimItems(newClaimItems);
    }

    const addCode = (newTransfers: (Transfers & { toAddressInfo: (BitBadgesUserInfo | undefined)[], numCodes?: number })[]) => {
        let newClaimItems: ClaimItem[] = []
        for (const transfer of newTransfers) {
            const codes = [];
            const addresses = [];

            if (transfer.numCodes && transfer.numCodes > 0) {
                for (let i = 0; i < transfer.numCodes; i++) {
                    const code = crypto.randomBytes(32).toString('hex');
                    codes.push(code); //TODO: admin password salt and reusable passwords
                }
            } else {
                for (let i = 0; i < transfer.toAddresses.length; i++) {
                    const userInfo = transfer.toAddressInfo[i];
                    if (!userInfo) {
                        continue;
                    }
                    addresses.push(userInfo.cosmosAddress);
                }
            }

            const codesTree = new MerkleTree(codes.map(x => SHA256(x)), SHA256);
            const codesRoot = codesTree.getRoot().toString('hex');

            const addressesTree = new MerkleTree(addresses.map(x => SHA256(x)), SHA256);
            const addressesRoot = addressesTree.getRoot().toString('hex');


            const newClaimItem: ClaimItem = {
                addresses: addresses,
                codes: codes,
                addressesTree: addressesTree,
                codeTree: codesTree,
                whitelistRoot: addressesRoot,
                codeRoot: codesRoot,
                uri: '',
                amount: transfer.balances[0]?.balance,
                badgeIds: transfer.balances[0]?.badgeIds,
                timeRange: {
                    start: 0,
                    end: GO_MAX_UINT_64,
                },
                balances: [], //will do in calculateNewBalances()
                limitPerAccount: 2, //one per account
                incrementIdsBy: 1,
            }

            newClaimItems.push(newClaimItem);
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
                        {undistributedBalances.balances.length > 0 && <BalanceDisplay
                            size={40}
                            collection={badgeCollection} balance={undistributedBalances}
                        />}
                        {undistributedBalances.balances.length === 0 && <Empty
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
                                        return <CollapsePanel header={<div style={{ margin: 0, color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>


                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                                {distributionMethod === DistributionMethod.Codes ? <Text strong style={{ color: PRIMARY_TEXT }}>
                                                    {leaf.codeRoot}
                                                </Text> :
                                                    <>
                                                        {leaf.addresses.map(cosmosAddr => {
                                                            return <AddressDisplay key={cosmosAddr} userInfo={accounts.accounts[cosmosAddr]} fontColor={PRIMARY_TEXT} fontSize={14} />
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
                                                        Code Root
                                                    </Text>
                                                    <br />
                                                    <Text copyable strong style={{ color: PRIMARY_TEXT, fontSize: 16, }}>
                                                        {leaf.codeRoot}
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

                                                                return accounts.accounts[addr].accountNumber
                                                            }) : [],
                                                            balances: [
                                                                {
                                                                    balance: leaf.amount,
                                                                    badgeIds: leaf.badgeIds
                                                                }
                                                            ],
                                                            toAddressInfo: leaf.addresses.map(addr => {

                                                                return accounts.accounts[addr]
                                                            })
                                                        }
                                                    ]}
                                                    toCodes={distributionMethod === DistributionMethod.Codes ? leaf.codes : [

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