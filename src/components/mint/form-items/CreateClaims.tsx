import { CloseOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, Divider, Empty, InputNumber, Steps, Tooltip, Typography } from 'antd';
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
import { InformationDisplayCard } from '../../common/InformationDisplayCard';
import { IdRangesInput } from '../../common/IdRangesInput';

const crypto = require('crypto');

const { Text } = Typography;

const { Step } = Steps;

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
    const [showForm, setShowForm] = useState<boolean>(false);

    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };


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

    let postCurrBalance = newBalances;

    for (const badgeId of currBalances[0]?.badgeIds) {
        postCurrBalance = getPostTransferBalance(JSON.parse(JSON.stringify(postCurrBalance)), badgeId.start, badgeId.end, currBalances[0]?.balance,
            distributionMethod === DistributionMethod.Codes ? numCodes : users.length);
    }

    const idRangesOverlap = currBalances[0].badgeIds.some(({ start, end }, i) => {
        const start1 = start;
        const end1 = end
        return currBalances[0].badgeIds.some(({ start, end }, j) => {
            const start2 = start;
            const end2 = end;
            if (i === j) {
                return false;
            }
            return start1 <= end2 && start2 <= end1;
        });
    });
    console.log("ID RANGES OVERLAP", idRangesOverlap)

    return <div style={{ justifyContent: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center', color: PRIMARY_TEXT, justifyContent: 'center', display: 'flex', width: '100%' }}>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '48%', display: 'flex' }}>
                    <InformationDisplayCard
                        title='Undistributed Badges'
                    >
                        {newBalances.balances.length > 0 && <BalanceDisplay
                            size={40}
                            collection={badgeCollection} balance={newBalances}
                        />}
                        {newBalances.balances.length === 0 && <Empty
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
                                                {/* <hr /> */}
                                                {/* <h3>Claim #{currIndex + 1}</h3> */}
                                                <TransferDisplay

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






                        </>
                    </InformationDisplayCard>


                </div>

            </div>

        </div >
        <br />


        {!showForm && newBalances?.balances.length > 0 &&
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Button
                    type='primary'
                    onClick={() => {
                        setShowForm(true);
                    }}
                >
                    <div>{distributionMethod === DistributionMethod.Codes ? 'Generate New Code(s)' : 'Add Users to Whitelist'}</div>
                </Button>
            </div>
        }

        {showForm && <>
            <br />
            <hr />
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <div></div>
                <h2>
                    {distributionMethod === DistributionMethod.Codes ? 'Generate New Code(s)' : 'Add Users to Whitelist'}
                </h2>
                <div>
                    <Tooltip title='Cancel'>
                        <CloseOutlined onClick={() => {
                            setShowForm(false);
                        }}
                            size={40}
                            style={{
                                color: PRIMARY_TEXT
                            }}
                        />
                    </Tooltip>
                </div>
            </div>
            {newBalances && newBalances.balances.length > 0 ?
                <div style={{ color: PRIMARY_TEXT }}>
                    <Steps
                        current={currentStep}
                        onChange={onStepChange}
                        direction="vertical"
                    >
                        <Step
                            title={<b>{distributionMethod === DistributionMethod.Codes ? `Select Number of Codes (${numCodes})` : `Select Recipients (${users.length})`}</b>}
                            description={
                                <div style={{ color: PRIMARY_TEXT }}>
                                    {currentStep === 0 && <div>
                                        {distributionMethod === DistributionMethod.Whitelist && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <div style={{ minWidth: 500 }} >
                                                <AddressListSelect
                                                    users={users}
                                                    setUsers={setUsers}
                                                    darkMode
                                                />
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
                                    </div>}
                                </div>
                            }
                            disabled={distributionMethod === DistributionMethod.Codes ? numCodes === 0 : users.length === 0}
                        />
                        <Step
                            title={<b>{'Select Badges'}</b>}
                            description={
                                <div style={{ color: PRIMARY_TEXT }}>
                                    {currentStep === 1 && <div>
                                        <IdRangesInput
                                            setIdRanges={(badgeIds) => {
                                                setCurrBalances([
                                                    {
                                                        balance: currBalances[0]?.balance || 0,
                                                        badgeIds
                                                    }
                                                ]);
                                            }}
                                            maximum={collection?.nextBadgeId ? collection?.nextBadgeId - 1 : undefined}
                                            darkMode
                                        />
                                        <Divider />
                                        {currBalances.map((balance, index) => {
                                            // console.log(balance);
                                            return <div key={index}>
                                                <TransferDisplay
                                                    fontColor={PRIMARY_TEXT}
                                                    hideAddresses
                                                    amount={Number(balance.balance) * users.length}
                                                    badgeIds={balance.badgeIds}
                                                    collection={collection}
                                                    from={[{
                                                        chain: chain.chain,
                                                        address: chain.address,
                                                        accountNumber: chain.accountNumber,
                                                        cosmosAddress: chain.cosmosAddress,
                                                    }]}
                                                    to={users}
                                                    toCodes={new Array(numCodes)}
                                                    hideBalances={true}
                                                />
                                                {/* <hr /> */}
                                            </div>
                                        })}
                                    </div>}
                                </div>
                            }
                            disabled={distributionMethod === DistributionMethod.Codes ? numCodes === 0 : users.length === 0}
                        />
                        <Step
                            title={<b>{'Select Amounts'}</b>}
                            description={
                                <div style={{ color: PRIMARY_TEXT }}>
                                    {currentStep === 2 && <div>
                                        <br />
                                        <BalancesInput
                                            balances={currBalances}
                                            setBalances={setCurrBalances}
                                            collection={collection}
                                            darkMode
                                        />
                                        {/* <hr /> */}
                                        <Divider />
                                        {currBalances.map((balance, index) => {
                                            // console.log(balance);
                                            return <div key={index}>
                                                <TransferDisplay
                                                    fontColor={PRIMARY_TEXT}
                                                    hideAddresses
                                                    amount={
                                                        distributionMethod === DistributionMethod.Codes ?
                                                            Number(balance.balance) * numCodes :
                                                            Number(balance.balance) * users.length}
                                                    badgeIds={balance.badgeIds}
                                                    collection={collection}
                                                    toCodes={new Array(numCodes)}
                                                    from={[{
                                                        chain: chain.chain,
                                                        address: chain.address,
                                                        accountNumber: chain.accountNumber,
                                                        cosmosAddress: chain.cosmosAddress,
                                                    }]}
                                                    to={users}
                                                />
                                                {/* <hr /> */}
                                            </div>
                                        })}
                                        <Divider />
                                        {newBalances && <BalanceBeforeAndAfter collection={badgeCollection} balance={newBalances} newBalance={postCurrBalance} partyString='Undistributed' beforeMessage='Before' afterMessage='After' />}
                                        <Divider />
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
                                                    setShowForm(false);
                                                    setCurrentStep(1);

                                                }}
                                                disabled={currBalances[0]?.balance <= 0 || currBalances[0]?.badgeIds[0]?.start < 0 || currBalances[0]?.badgeIds[0]?.end < 0 || currBalances[0]?.badgeIds[0]?.start > currBalances[0]?.badgeIds[0]?.end || !!postCurrBalance.balances.find((balance) => balance.balance < 0) || (distributionMethod === DistributionMethod.Whitelist && !!users.find((x) => !x.cosmosAddress))}
                                            >
                                                {distributionMethod === DistributionMethod.Whitelist ? 'Add Users to Whitelist' : 'Generate Codes'}
                                            </Button>
                                        </div>
                                        <Divider />
                                    </div>}
                                </div>
                            }
                            disabled={idRangesOverlap || distributionMethod === DistributionMethod.Codes ? numCodes === 0 : users.length === 0}
                        />
                    </Steps>


                </div> : <></>
            }
        </>
        }
    </div>
}