import { CloseOutlined } from '@ant-design/icons';
import { Button, Divider, InputNumber, Steps, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../accounts/AccountsContext';
import { getFullBadgeIdRanges } from '../../bitbadges-api/badges';
import { getBlankBalance, getPostTransferBalance } from '../../bitbadges-api/balances';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, DistributionMethod, Transfers, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { useCollectionsContext } from '../../collections/CollectionsContext';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { AddressListSelect } from '../address/AddressListSelect';
import { TransferDisplay } from '../common/TransferDisplay';
import { BalanceBeforeAndAfter } from './BalanceBeforeAndAfter';
import { BalancesInput } from './BalancesInput';
import { IdRangesInput } from './IdRangesInput';

const { Step } = Steps;

export function TransferSelect({
    transfers,
    setTransfers,
    fromUser,
    collection,
    userBalance,
    distributionMethod,
    hideTransferDisplay
}: {
    transfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[],
    setTransfers: (transfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[]) => void;
    fromUser: BitBadgesUserInfo,
    userBalance: UserBalance,
    collection: BitBadgeCollection;
    distributionMethod: DistributionMethod;
    hideTransferDisplay?: boolean;
}) {
    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const chain = useChainContext();
    const accounts = useAccountsContext();
    const collections = useCollectionsContext();

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

    useEffect(() => {
        let postTransferBalanceObj = userBalance;
        let preTransferBalanceObj = userBalance;
        if (fromUser.accountNumber !== chain.accountNumber) {
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
    }, [balances, userBalance, collection, toAddresses.length, chain.accountNumber, fromUser.accountNumber, transfers, distributionMethod, numCodes])



    const forbiddenAddresses = [];

    let isManagerApprovedTransfer = false;
    const managerUnapprovedAddresses: any[] = [];

    for (const address of toAddresses) {
        for (const managerApprovedTransferMapping of collection.managerApprovedTransfers) {
            let fromIsApproved = false;
            let toIsApproved = false;

            if (managerApprovedTransferMapping.from.options === 2 && chain.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                fromIsApproved = false;
            } else {
                if (managerApprovedTransferMapping.from.options === 1) {
                    //include manager and we are the manager
                    if (chain.accountNumber === collection.manager.accountNumber) {
                        fromIsApproved = true;
                    }
                }


                for (const idRange of managerApprovedTransferMapping.from.accountNums) {
                    if (idRange.start <= chain.accountNumber && idRange.end >= chain.accountNumber) {
                        fromIsApproved = true;
                        break;
                    }
                }
            }

            if (managerApprovedTransferMapping.to.options === 2 && address.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                toIsApproved = false;
            } else {
                if (managerApprovedTransferMapping.to.options === 1) {
                    //include manager and we are the manager
                    if (address.accountNumber === collection.manager.accountNumber) {
                        toIsApproved = true;
                    }
                }

                for (const idRange of managerApprovedTransferMapping.to.accountNums) {
                    if (idRange.start <= address.accountNumber && idRange.end >= address.accountNumber) {
                        toIsApproved = true;
                        break;
                    }
                }
            }

            if (fromIsApproved && toIsApproved) {
                isManagerApprovedTransfer = true;
                managerUnapprovedAddresses.push(address);
            }
        }
    }

    for (const address of toAddresses) {
        for (const disallowedTransferMapping of collection.disallowedTransfers) {
            let fromIsForbidden = false;
            let toIsForbidden = false;

            if (disallowedTransferMapping.from.options === 2 && chain.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                fromIsForbidden = false;
            } else {
                if (disallowedTransferMapping.from.options === 1) {
                    //include manager and we are the manager
                    if (chain.accountNumber === collection.manager.accountNumber) {
                        fromIsForbidden = true;
                    }
                }


                for (const idRange of disallowedTransferMapping.from.accountNums) {
                    if (idRange.start <= chain.accountNumber && idRange.end >= chain.accountNumber) {
                        fromIsForbidden = true;
                        break;
                    }
                }
            }

            if (disallowedTransferMapping.to.options === 2 && address.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                toIsForbidden = false;
            } else {
                if (disallowedTransferMapping.to.options === 1) {
                    //include manager and we are the manager
                    if (address.accountNumber === collection.manager.accountNumber) {
                        toIsForbidden = true;
                    }
                }

                for (const idRange of disallowedTransferMapping.to.accountNums) {
                    if (idRange.start <= address.accountNumber && idRange.end >= address.accountNumber) {
                        toIsForbidden = true;
                        break;
                    }
                }
            }

            if (fromIsForbidden && toIsForbidden) {
                forbiddenAddresses.push(address);
            }
        }
    }



    const unapprovedAddresses: any[] = [];
    for (const approvalBalance of userBalance.approvals) {
        //TODO: approvals
    }


    const isUnapprovedTransfer = unapprovedAddresses.length > 0;
    const isDisallowedTransfer = forbiddenAddresses.length > 0;



    const firstStepDisabled = distributionMethod === DistributionMethod.Codes ? numCodes <= 0 : toAddresses.length === 0;

    const secondStepDisabled = balances.length == 0 || !!postTransferBalance?.balances?.find((balance) => balance.balance < 0);

    let canTransfer = false;
    if (chain.accountNumber === collection.manager.accountNumber && isManagerApprovedTransfer) {
        canTransfer = true;
    } else if (!isDisallowedTransfer && !isUnapprovedTransfer) {
        canTransfer = true;
    }




    let messages: string[] = [];
    let badUsers = [];



    if (!canTransfer) {
        for (const _ of forbiddenAddresses) {
            messages.push(`Transfer to this recipient has been disallowed by the manager.`);
        }

        for (const _ of unapprovedAddresses) {
            messages.push(`You are not approved to transfer on behalf of the sender.`);
        }

        badUsers.push(...forbiddenAddresses, ...unapprovedAddresses);

        if (chain.accountNumber === fromUser.accountNumber && chain.accountNumber === collection.manager.accountNumber) {
            //only show overlap between the two
            badUsers = badUsers.filter((user, idx) => {
                if (managerUnapprovedAddresses.includes(user)) {
                    //filter out the messages that has an index of idx
                    messages = messages.filter((_, index) => index !== idx);
                    return true;
                }

                return false;
            });
        }

        if (badUsers.length === 0) {
            canTransfer = true;
        }
    }

    for (const address of toAddresses) {
        if (address.cosmosAddress === fromUser.cosmosAddress) {
            messages.push('Recipient cannot equal sender.');
            badUsers.push({
                address: chain.address,
                cosmosAddress: chain.cosmosAddress,
                accountNumber: chain.accountNumber,
                chain: chain.chain,
            });
            canTransfer = false;
        }
    }

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

    //TODO: disableds

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
                    disallowedUsers={badUsers}
                    disallowedMessages={messages}
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
                    from={[fromUser]}
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
                    collection={collection}
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
                    from={[fromUser]}
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
                    from={[fromUser]}
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
                        from={[fromUser]}
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