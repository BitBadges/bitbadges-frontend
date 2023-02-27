import { CloseOutlined } from '@ant-design/icons';
import { Button, Divider, InputNumber, Steps, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { getFullBadgeIdRanges, getMatchingAddressesFromTransferMapping } from '../../bitbadges-api/badges';
import { getBlankBalance, getPostTransferBalance } from '../../bitbadges-api/balances';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, DistributionMethod, Transfers, UserBalance } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { AddressListSelect } from '../address/AddressListSelect';
import { BalanceBeforeAndAfter } from '../balances/BalanceBeforeAndAfter';
import { BalancesInput } from '../balances/BalancesInput';
import { IdRangesInput } from '../balances/IdRangesInput';
import { TransferDisplay } from './TransferDisplay';

const { Step } = Steps;

export function TransferSelect({
    transfers,
    setTransfers,
    sender,
    collection,
    userBalance,
    distributionMethod,
    hideTransferDisplay
}: {
    transfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[],
    setTransfers: (transfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[]) => void;
    sender: BitBadgesUserInfo,
    userBalance: UserBalance,
    collection: BitBadgeCollection;
    distributionMethod: DistributionMethod;
    hideTransferDisplay?: boolean;
}) {
    const chain = useChainContext();

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [addTransferIsVisible, setAddTransferIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    const [numCodes, setNumCodes] = useState<number>(1);
    const [balances, setBalances] = useState<Balance[]>([
        {
            balance: 1,
            badgeIds: getFullBadgeIdRanges(collection)
        },
    ]);
    const [postTransferBalance, setPostTransferBalance] = useState<UserBalance>();
    const [preTransferBalance, setPreTransferBalance] = useState<UserBalance>();

    //Whenever something changes, update the pre and post transfer balances
    useEffect(() => {
        let postTransferBalanceObj = userBalance;
        let preTransferBalanceObj = userBalance;
        if (sender.accountNumber !== chain.accountNumber) {
            postTransferBalanceObj = userBalance;
            preTransferBalanceObj = userBalance;
        }

        if (!postTransferBalanceObj || postTransferBalanceObj === getBlankBalance()) return;
        if (!preTransferBalanceObj || preTransferBalanceObj === getBlankBalance()) return;

        const numRecipients = distributionMethod === DistributionMethod.Codes ? numCodes : toAddresses.length

        for (const transfer of transfers) {
            for (const balance of transfer.balances) {
                for (const idRange of balance.badgeIds) {
                    postTransferBalanceObj = getPostTransferBalance(postTransferBalanceObj, idRange.start, idRange.end, balance.balance, numRecipients);
                    preTransferBalanceObj = getPostTransferBalance(preTransferBalanceObj, idRange.start, idRange.end, balance.balance, numRecipients);
                }
            }
        }

        for (const balance of balances) {
            for (const idRange of balance.badgeIds) {
                postTransferBalanceObj = getPostTransferBalance(postTransferBalanceObj, idRange.start, idRange.end, balance.balance, numRecipients);
            }
        }

        setPostTransferBalance(postTransferBalanceObj);
        setPreTransferBalance(preTransferBalanceObj);
    }, [balances, userBalance, collection, toAddresses.length, chain.accountNumber, sender.accountNumber, transfers, distributionMethod, numCodes])


    const forbiddenAddresses = getMatchingAddressesFromTransferMapping(collection.disallowedTransfers, toAddresses, chain, collection.manager.accountNumber);
    const managerApprovedAddresses = getMatchingAddressesFromTransferMapping(collection.managerApprovedTransfers, toAddresses, chain, collection.manager.accountNumber);

    //If sender !== current user, check if they have any approvals. 
    //In the future, we should check the exact approvals. For now, we just check if approval.balances.length > 0.
    const unapprovedAddresses: any[] = [];
    if (chain.accountNumber !== sender.accountNumber) {
        const approval = userBalance.approvals.find((approval) => approval.address === chain.accountNumber);
        if (!approval || (approval && approval.balances.length === 0)) {
            for (const address of toAddresses) {
                unapprovedAddresses.push(address);
            }
        }
    }

    let forbiddenUsersMap: { [cosmosAddress: string]: string } = {};
    for (const address of toAddresses) {
        //If forbidden or unapproved, add to map
        if (forbiddenAddresses.includes(address)) {
            forbiddenUsersMap[address.cosmosAddress] = `Transfer to this recipient has been disallowed by the manager.`;
        }

        if (unapprovedAddresses.includes(address)) {
            forbiddenUsersMap[address.cosmosAddress] = `The selected sender has not approved you to transfer on their behalf.`;
        }

        //If manager approved transfer, this overrides the disallowed transfer
        if (chain.accountNumber === collection.manager.accountNumber && managerApprovedAddresses.includes(address)) {
            delete forbiddenUsersMap[address.cosmosAddress];
        }

        //Even in the case of manager approved transfer, the sender cannot be the recipient
        if (address.cosmosAddress === sender.cosmosAddress) {
            forbiddenUsersMap[address.cosmosAddress] = `Recipient cannot equal sender.`;
        }
    }

    let canTransfer = Object.values(forbiddenUsersMap).find((message) => message !== '') === undefined;

    const firstStepDisabled = distributionMethod === DistributionMethod.Codes ? numCodes <= 0 : toAddresses.length === 0;
    const secondStepDisabled = balances.length == 0 || !!postTransferBalance?.balances?.find((balance) => balance.balance < 0);

    const idRangesOverlap = balances[0].badgeIds.some(({ start, end }, i) => {
        const start1 = start;
        const end1 = end
        return balances[0].badgeIds.some(({ start, end }, j) => {
            const start2 = start;
            const end2 = end;
            if (i === j) {
                return false;
            }
            return start1 <= end2 && start2 <= end1;
        });
    });

    const idRangesLengthEqualsZero = balances[0].badgeIds.length === 0;

    const TransferSteps = [
        distributionMethod === DistributionMethod.Codes ? {
            title: `Codes (${numCodes})`,
            description: < div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ minWidth: 500 }} >
                    <br />
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
            </div >,
            disabled: numCodes <= 0
        } :
            {
                title: `Recipients (${toAddresses.length})`,
                description: <AddressListSelect
                    users={toAddresses}
                    setUsers={setToAddresses}
                    disallowedUsers={forbiddenUsersMap}
                    darkMode
                />,
                disabled: firstStepDisabled || !canTransfer,
            },
        {
            title: 'Badges',
            description: <div>
                <br />
                <IdRangesInput
                    setIdRanges={(badgeIds) => {
                        setBalances([
                            {
                                balance: balances[0]?.balance || 0,
                                badgeIds
                            }
                        ]);
                    }}
                    maximum={collection?.nextBadgeId ? collection?.nextBadgeId - 1 : undefined}
                    darkMode
                />

                <Divider />
                <TransferDisplay
                    setTransfers={setTransfers}
                    transfers={[
                        {
                            toAddresses: toAddresses.map((user) => user.accountNumber),
                            balances: balances,
                            toAddressInfo: toAddresses,
                        }
                    ]}
                    collection={collection}
                    fontColor={PRIMARY_TEXT}
                    from={[sender]}
                    toCodes={distributionMethod === DistributionMethod.Codes ? new Array(numCodes) : []}
                    hideAddresses
                    hideBalances
                />
            </div>,
            disabled: idRangesOverlap || idRangesLengthEqualsZero || firstStepDisabled || !canTransfer,
        },
        {
            title: 'Amounts',
            description: <div>
                <br />
                <BalancesInput
                    balances={balances}
                    setBalances={setBalances}
                    darkMode
                />
                {/* <hr /> */}
                <TransferDisplay
                    transfers={[
                        {
                            toAddresses: toAddresses.map((user) => user.accountNumber),
                            balances: balances,
                            toAddressInfo: toAddresses,
                        }
                    ]}
                    collection={collection}
                    fontColor={PRIMARY_TEXT}
                    from={[sender]}
                    setTransfers={setTransfers}
                    toCodes={distributionMethod === DistributionMethod.Codes ? new Array(numCodes) : []}
                    hideAddresses
                />
                <Divider />
                {postTransferBalance && <BalanceBeforeAndAfter collection={collection} balance={preTransferBalance ? preTransferBalance : userBalance} newBalance={postTransferBalance} partyString='' beforeMessage='Before Transfer' afterMessage='After Transfer' />}
            </div>,
            disabled: idRangesOverlap || idRangesLengthEqualsZero || secondStepDisabled
        },
        {

            title: 'Confirm',
            description: <div>
                <TransferDisplay
                    setTransfers={setTransfers}
                    transfers={[
                        {
                            toAddresses: toAddresses.map((user) => user.accountNumber),
                            balances: balances,
                            toAddressInfo: toAddresses,
                        }
                    ]}
                    collection={collection}
                    fontColor={PRIMARY_TEXT}
                    toCodes={distributionMethod === DistributionMethod.Codes ? new Array(numCodes) : []}
                    from={[sender]}
                />

                <Divider />
                <Button type='primary'
                    style={{ width: '100%' }}
                    onClick={async () => {

                        setTransfers([...transfers, {
                            toAddresses: distributionMethod === DistributionMethod.Codes ? new Array(numCodes) : toAddresses.map((user) => user.accountNumber),
                            balances,
                            toAddressInfo: toAddresses,
                        }]);
                        setToAddresses([]);
                        setBalances([
                            {
                                balance: 1,
                                badgeIds: getFullBadgeIdRanges(collection)
                            },
                        ]);

                        setAddTransferIsVisible(false);
                        setCurrentStep(0);
                    }}>
                    Add Transfer
                </Button>
            </div>

        }]


    return <div style={{ width: 800, alignItems: 'center', color: PRIMARY_TEXT }}>
        <div>
            {
                !addTransferIsVisible && !hideTransferDisplay && <div>
                    <div className='flex-between'>
                        <div></div>
                        <h2 style={{ textAlign: 'center', color: PRIMARY_TEXT }}>Added Transfers ({transfers.length})</h2>
                        <div></div>
                    </div>

                    <TransferDisplay
                        transfers={transfers}
                        setTransfers={setTransfers}
                        collection={collection}
                        fontColor={PRIMARY_TEXT}
                        from={[sender]}
                        toCodes={distributionMethod === DistributionMethod.Codes ? new Array(numCodes) : []}
                        deletable
                    />
                    <Divider />
                </div>
            }

            {
                addTransferIsVisible ?

                    <div>
                        < div className='flex-between' >
                            <div></div>

                            <h2 style={{ textAlign: 'center', color: PRIMARY_TEXT }}>Add Transfer?</h2>
                            <div>
                                <Tooltip title='Cancel' placement='bottom'>
                                    <CloseOutlined
                                        onClick={() => {
                                            setAddTransferIsVisible(false);
                                        }}
                                        style={{ fontSize: 20, cursor: 'pointer', color: PRIMARY_TEXT }}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                        <Steps
                            current={currentStep}
                            onChange={onStepChange}
                            direction='horizontal'
                            type='navigation'
                        >
                            {TransferSteps.map((item, index) => (
                                <Step
                                    key={index}
                                    title={<b>{item.title}</b>}
                                    disabled={TransferSteps && TransferSteps.find((step, idx) => step.disabled && idx < index) ? true : false}
                                />
                            ))}
                        </Steps>
                        {TransferSteps.map((item, index) => (
                            <div key={index} style={{ color: PRIMARY_TEXT }}>
                                {currentStep === index && <div>
                                    {item.description}
                                </div>}
                            </div>
                        ))}
                    </div>
                    : <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                            type='primary'
                            onClick={() => {
                                setAddTransferIsVisible(true);
                            }}
                            style={{ marginTop: 20, width: '100%' }}
                        >
                            Add New Transfer
                        </Button>
                    </div>}
            <br />
        </div>
    </div>



}