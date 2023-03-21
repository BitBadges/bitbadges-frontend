import { DeleteOutlined } from '@ant-design/icons';
import { Collapse, Divider, Empty, Pagination, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useEffect, useState } from 'react';
import { getClaimsFromClaimItems, getTransfersFromClaimItems } from '../../../bitbadges-api/claims';
import { Balance, BitBadgeCollection, ClaimItem, DistributionMethod, TransfersExtended, UserBalance } from '../../../bitbadges-api/types';
import { DEV_MODE, GO_MAX_UINT_64, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { useAccountsContext } from '../../../contexts/AccountsContext';
import { BalanceDisplay } from '../../balances/BalanceDisplay';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { TransferDisplay } from '../../transfers/TransferDisplay';
import { TransferSelect } from '../../transfers/TransferSelect';

const crypto = require('crypto');

const { Text } = Typography;

export function CreateClaims({
    collection,
    newCollectionMsg,
    setNewCollectionMsg,
    distributionMethod,
    claimItems,
    setClaimItems,
    balancesToDistribute,
    manualSend
}: {
    collection: BitBadgeCollection;
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    distributionMethod: DistributionMethod;
    claimItems: ClaimItem[];
    setClaimItems: (claimItems: ClaimItem[]) => void;
    balancesToDistribute?: Balance[];
    manualSend: boolean;
}) {
    const badgeCollection = collection;

    const accounts = useAccountsContext();

    const [currPage, setCurrPage] = useState(1);
    const [undistributedBalances, setUndistributedBalances] = useState<UserBalance>(
        balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : {
            balances: JSON.parse(JSON.stringify(badgeCollection.maxSupplys)),
            approvals: []
        });

    const [transfers, setTransfers] = useState<(TransfersExtended)[]>(claimItems ?
        getTransfersFromClaimItems(claimItems, accounts) : []
    );

    const setTransfersHandler = (newTransfers: (TransfersExtended)[]) => {
        setTransfers([...transfers, ...newTransfers]);
        addCode([...transfers, ...newTransfers]);
    }

    useEffect(() => {
        if (claimItems) {
            calculateNewBalances(claimItems);
        }
    }, []);

    const calculateNewBalances = (newClaimItems: ClaimItem[]) => {
        const balance = balancesToDistribute ? {
            balances: JSON.parse(JSON.stringify(balancesToDistribute)),
            approvals: [],
        } : {
            balances: JSON.parse(JSON.stringify(badgeCollection.maxSupplys)),
            approvals: []
        };

        const claimsRes = getClaimsFromClaimItems(balance, newClaimItems);
        const transfersRes = getTransfersFromClaimItems(newClaimItems, accounts);

        if (manualSend) {
            setNewCollectionMsg({
                ...newCollectionMsg,
                claims: [],
                transfers: transfersRes.map(x => {
                    return {
                        balances: x.balances,
                        toAddresses: x.toAddresses,
                    }
                })
            })
        } else {
            setNewCollectionMsg({
                ...newCollectionMsg,
                claims: claimsRes.claims,
                transfers: []
            })
        }

        setUndistributedBalances(claimsRes.undistributedBalance);
        setClaimItems(newClaimItems);
        setTransfers(transfersRes);
    }

    const addCode = (newTransfers: (TransfersExtended)[]) => {
        let newClaimItems: ClaimItem[] = claimItems;
        for (const transfer of newTransfers) {
            const codes = [];
            const addresses = [];

            if (transfer.numCodes && transfer.numCodes > 0) {
                if (distributionMethod === DistributionMethod.Codes) {
                    for (let i = 0; i < transfer.numCodes; i++) {
                        const code = crypto.randomBytes(32).toString('hex');
                        codes.push(code);
                    }
                }
            } else {
                for (let i = 0; i < transfer.toAddresses.length; i++) {
                    const userInfo = transfer.toAddressInfo ? transfer.toAddressInfo[i] : undefined;
                    if (!userInfo) {
                        continue;
                    }
                    addresses.push(userInfo.cosmosAddress);
                }
            }

            const hashedCodes = codes.map(x => SHA256(x).toString());
            const codesTree = new MerkleTree(hashedCodes.map(x => SHA256(x).toString()), SHA256);
            const codesRoot = codesTree.getRoot().toString('hex');

            const addressesTree = new MerkleTree(addresses.map(x => SHA256(x)), SHA256);
            const addressesRoot = addressesTree.getRoot().toString('hex');

            const newClaimItem: ClaimItem = {
                addresses: addresses,
                codes: codes,
                hashedCodes: hashedCodes,
                addressesTree: addressesTree,
                codeTree: codesTree,
                whitelistRoot: addressesRoot,
                codeRoot: codesRoot,
                uri: '',
                amount: transfer.balances[0]?.balance,
                badgeIds: transfer.balances[0]?.badgeIds,
                timeRange: transfer.timeRange ? transfer.timeRange : {
                    start: 0,
                    end: GO_MAX_UINT_64,
                },
                balances: [], //will do in calculateNewBalances()
                limitPerAccount: 2, //one per account
                incrementIdsBy: transfer.incrementBy ? transfer.incrementBy : 0,
                numIncrements: transfer.numIncrements ? transfer.numIncrements : 0,
                password: transfer.password ? transfer.password : '',
                hasPassword: transfer.password ? true : false,
                numCodes: transfer.numCodes ? transfer.numCodes : 0,
                expectedMerkleProofLength: codesTree.getLayerCount() - 1,
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
                        title={distributionMethod === DistributionMethod.Codes ? 'Codes' : distributionMethod === DistributionMethod.Whitelist ? 'Whitelist' : 'Claims'}
                    ><>
                            {claimItems.length === 0 && <Empty
                                style={{ color: PRIMARY_TEXT }}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={distributionMethod === DistributionMethod.Codes ? 'No codes generated.' : distributionMethod === DistributionMethod.Whitelist ? 'No users added.' : 'No claims added.'} />}

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

                                        return <CollapsePanel header={<div style={{ margin: 0, color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>


                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                                {distributionMethod === DistributionMethod.Codes ? <Text strong style={{ color: PRIMARY_TEXT }}>
                                                    {leaf.password ? 'Password: ' + leaf.password : 'Unique Codes: ' + leaf.codes.length}

                                                </Text> : distributionMethod === DistributionMethod.Whitelist ?
                                                    <>

                                                        {manualSend ? 'Direct Transfers:' : 'Whitelist:'} {'' + leaf.addresses.length + " Users"}
                                                    </> : <>
                                                        {'Open Claim #' + (index + 1)}
                                                    </>
                                                }
                                            </div>
                                            <div>
                                                <Tooltip title='Delete'>
                                                    <DeleteOutlined onClick={
                                                        () => {
                                                            const newClaimItems = claimItems.filter((_, i) => i !== index);
                                                            calculateNewBalances(newClaimItems);
                                                        }
                                                    } />
                                                </Tooltip>
                                            </div>
                                        </div>}
                                            key={index} style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                                            <div style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                                                {distributionMethod === DistributionMethod.Codes ? <>
                                                    <Text strong style={{ color: PRIMARY_TEXT, fontSize: 16 }}>
                                                        {leaf.password ? 'Password: ' + leaf.password : 'Unique Codes: ' + leaf.codes.length}
                                                    </Text>
                                                    <br />
                                                </> :
                                                    <></>
                                                }

                                                <TransferDisplay
                                                    collection={badgeCollection}
                                                    fontColor={PRIMARY_TEXT}
                                                    from={[
                                                        MINT_ACCOUNT
                                                    ]}
                                                    setTransfers={() => { }}
                                                    transfers={
                                                        manualSend ?
                                                            transfers
                                                            :
                                                            [
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
                                                                    }),
                                                                    incrementBy: leaf.incrementIdsBy,
                                                                    password: leaf.password,
                                                                    numIncrements: leaf.numIncrements,
                                                                    numCodes: leaf.numCodes,

                                                                }
                                                            ]}
                                                    toCodes={distributionMethod === DistributionMethod.Codes ? leaf.codes :

                                                        distributionMethod === DistributionMethod.FirstComeFirstServe ? new Array(leaf.numCodes) : [

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
                    userBalance={undistributedBalances}
                    distributionMethod={distributionMethod}
                    sender={MINT_ACCOUNT}
                    collection={badgeCollection}
                    hideTransferDisplay={true}
                    isWhitelist
                    manualSend={manualSend}
                    plusButton
                    showIncrementSelect={(distributionMethod === DistributionMethod.Whitelist && !manualSend) || distributionMethod === DistributionMethod.Codes}
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