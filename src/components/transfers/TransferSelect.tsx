import { CloseOutlined, InfoCircleOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Button, DatePicker, Divider, Input, InputNumber, Steps, Tooltip } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { getFullBadgeIdRanges, getMatchingAddressesFromTransferMapping } from '../../bitbadges-api/badges';
import { getBalanceAfterTransfers, getBlankBalance } from '../../bitbadges-api/balances';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, DistributionMethod, IdRange, Transfers, TransfersExtended, UserBalance } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { AddressListSelect } from '../address/AddressListSelect';
import { BalanceBeforeAndAfter } from '../balances/BalanceBeforeAndAfter';
import { BalancesInput } from '../balances/BalancesInput';
import { IdRangesInput } from '../balances/IdRangesInput';
import { NumberInput } from '../display/NumberInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TransferDisplay } from './TransferDisplay';

const { Step } = Steps;

export enum AmountSelectType {
    None,
    Custom,
    Snake,
    Linear,
}

export enum CodeType {
    None,
    Unique,
    Reusable
}

export function TransferSelect({
    transfers,
    setTransfers,
    sender,
    collection,
    userBalance,
    distributionMethod,
    hideTransferDisplay,
    isWhitelist,
    showIncrementSelect,
    manualSend,
    plusButton,
}: {
    transfers: (TransfersExtended)[],
    setTransfers: (transfers: (TransfersExtended)[]) => void;
    sender: BitBadgesUserInfo,
    userBalance: UserBalance,
    collection: BitBadgeCollection;
    distributionMethod?: DistributionMethod;
    hideTransferDisplay?: boolean;
    isWhitelist?: boolean;
    showIncrementSelect?: boolean;
    manualSend?: boolean;
    plusButton?: boolean;
}) {
    const chain = useChainContext();

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [amountSelectType, setAmountSelectType] = useState(AmountSelectType.None);
    const [addTransferIsVisible, setAddTransferIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [codeType, setCodeType] = useState(CodeType.None);
    const [currTimeRange, setCurrTimeRange] = useState<IdRange>({ start: 0, end: 0 });

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

    const [transfersToAdd, setTransfersToAdd] = useState<(Transfers & { toAddressInfo: BitBadgesUserInfo[], numCodes?: number, numIncrements?: number, incrementBy?: number, password?: string, salt?: string, timeRange?: IdRange })[]>([]);
    const [increment, setIncrement] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [warningMessage, setWarningMessage] = useState<string>('');

    const [codePassword, setCodePassword] = useState<string>('');

    const numRecipients = distributionMethod === DistributionMethod.Whitelist ? toAddresses.length : numCodes;
    let numBadgeIds = 0;
    let ids: number[] = [];
    for (const balance of balances) {
        for (const badgeIdRange of balance.badgeIds) {
            numBadgeIds += badgeIdRange.end - badgeIdRange.start + 1;
            for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
                ids.push(i);
            }
        }
    }

    // const amountSelectType = increment > 0 ? AmountSelectType.Linear : AmountSelectType.Custom;

    useEffect(() => {
        const numRecipients = distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? numCodes : toAddresses.length;
        if (numRecipients === 0) return;

        let newTransfersToAdd: (Transfers & { toAddressInfo: BitBadgesUserInfo[], numCodes?: number, numIncrements?: number, incrementBy?: number, password?: string, salt?: string, timeRange?: IdRange })[] = [];

        if ((numRecipients <= 1) || amountSelectType === AmountSelectType.Custom) {
            newTransfersToAdd = [{
                toAddresses: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? new Array(numCodes) : toAddresses.map((user) => user.accountNumber),
                balances: balances,
                toAddressInfo: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? [] : toAddresses,
                numCodes: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? numCodes : undefined,
                numIncrements: 0,
                incrementBy: 0,
                password: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? codePassword : '',
                timeRange: distributionMethod ? currTimeRange : undefined
            }];
        } else if (amountSelectType === AmountSelectType.Linear) {
            let numPerAddress = increment;

            let badgeIds: IdRange[] = [];
            let errorMessage = '';
            let warningMessage = '';
            for (const balance of balances) {
                for (const badgeIdRange of balance.badgeIds) {
                    badgeIds.push({
                        start: badgeIdRange.start,
                        end: badgeIdRange.start + increment - 1,
                    });
                    if ((badgeIdRange.start + (increment * numRecipients) - 1) > badgeIdRange.end) {
                        errorMessage = `You are attempting to distribute badges you didn't previously select (IDs  ${balance.badgeIds.map((range) => {
                            if ((range.start + (increment * numRecipients) - 1) > range.end) {
                                return `${range.end + 1}-${range.start + (increment * numRecipients) - 1}`;
                            } else {
                                return undefined;
                            }
                        }).filter(x => !!x).join(', ')}).`;
                    } else if ((badgeIdRange.start + (increment * numRecipients) - 1) < badgeIdRange.end) {
                        warningMessage = `This will not distribute the following badges: IDs ${balance.badgeIds.map((range) => {
                            if ((range.start + (increment * numRecipients) - 1) < range.end) {
                                return `${range.start + (increment * numRecipients)}-${range.end}`;
                            } else {
                                return undefined;
                            }
                        }).filter(x => !!x).join(', ')} `;
                    }


                }
            }
            setWarningMessage(warningMessage);
            setErrorMessage(errorMessage);

            if (manualSend && !errorMessage) {
                let currBadgeIds = JSON.parse(JSON.stringify([...badgeIds]));

                for (let i = 0; i < numRecipients; i++) {
                    newTransfersToAdd.push({
                        toAddresses: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? [0] : [toAddresses[i].accountNumber],
                        balances: [{
                            balance: balances[0]?.balance || 1,
                            badgeIds: JSON.parse(JSON.stringify([...currBadgeIds])),
                        }],
                        toAddressInfo: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? [] : [toAddresses[i]],
                        numCodes: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? 1 : undefined,
                        numIncrements: 0,
                        incrementBy: 0,
                        password: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? codePassword : '',
                        timeRange: distributionMethod ? currTimeRange : undefined
                    });



                    for (let j = 0; j < currBadgeIds.length; j++) {
                        currBadgeIds[j].start += increment;
                        currBadgeIds[j].end += increment;
                    }
                }

                console.log("newTransfers", newTransfersToAdd);
            }

            if (!manualSend) {
                newTransfersToAdd.push({
                    toAddresses: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? [0] : toAddresses.map((user) => user.accountNumber),
                    balances: [{
                        balance: balances[0]?.balance || 1,
                        badgeIds: badgeIds,
                    }],
                    toAddressInfo: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? [] : toAddresses,
                    numCodes: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? numCodes : undefined,
                    numIncrements: numRecipients,
                    incrementBy: numPerAddress,
                    password: distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? codePassword : '',
                    timeRange: distributionMethod ? currTimeRange : undefined
                });
            }
        }

        setTransfersToAdd(newTransfersToAdd);
    }, [amountSelectType, numRecipients, balances, toAddresses, distributionMethod, numCodes, increment, showIncrementSelect, manualSend, codePassword, currTimeRange]);

    //Whenever something changes, update the pre and post transfer balances
    useEffect(() => {
        //Calculate from beginning
        let postTransferBalanceObj = { ...userBalance };
        let preTransferBalanceObj = { ...userBalance };

        if (!postTransferBalanceObj || postTransferBalanceObj === getBlankBalance()) return;
        if (!preTransferBalanceObj || preTransferBalanceObj === getBlankBalance()) return;

        //Deduct all previous transfers
        postTransferBalanceObj = getBalanceAfterTransfers(postTransferBalanceObj, [...transfers]);
        preTransferBalanceObj = getBalanceAfterTransfers(preTransferBalanceObj, [...transfers]);

        //Deduct transfers to add
        postTransferBalanceObj = getBalanceAfterTransfers(postTransferBalanceObj, [...transfersToAdd]);

        setPostTransferBalance(postTransferBalanceObj);
        setPreTransferBalance(preTransferBalanceObj);
    }, [userBalance, chain.accountNumber, sender.accountNumber, transfers, transfersToAdd, distributionMethod, amountSelectType, numCodes, toAddresses, balances]);


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
    if (isWhitelist) canTransfer = true;

    const firstStepDisabled = distributionMethod !== DistributionMethod.Whitelist ? numCodes <= 0 : toAddresses.length === 0;
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



    let TransferSteps = [
        distributionMethod === DistributionMethod.Codes ? {
            title: `Codes (${numCodes})`,
            description: < div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ minWidth: 500 }} >
                    <br />
                    <div className='flex-between' style={{ flexDirection: 'column' }} >
                        {distributionMethod === DistributionMethod.Codes && <div>
                            <SwitchForm
                                options={[{
                                    title: 'Unique (Advanced)',
                                    message: 'Codes will be uniquely generated and one-time use only.',
                                    isSelected: codeType === CodeType.Unique,
                                },
                                {
                                    title: 'Reusable (Recommended)',
                                    message: `You enter a custom password that is to be used by all claimees (e.g. attendance code). Limited to one use per address.`,
                                    isSelected: codeType === CodeType.Reusable,
                                }]}
                                onSwitchChange={(_option, title) => {
                                    if (_option === 0) {
                                        setCodeType(CodeType.Unique);
                                    } else {
                                        setCodeType(CodeType.Reusable);
                                    }
                                    setCodePassword('');
                                }}

                            />
                        </div>}
                        {codeType === CodeType.Reusable && <div style={{ textAlign: 'center' }}>
                            <br />
                            <b style={{ textAlign: 'center' }}>Password</b>
                            <Input
                                value={codePassword}
                                onChange={(e) => {
                                    setCodePassword(e.target.value);
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                        </div>}
                        <br />
                        <b>Number of {codeType === CodeType.Unique ? 'Codes' : 'Uses'}</b>
                        <InputNumber
                            min={1}
                            max={100000}
                            value={numCodes}
                            onChange={(value) => {
                                setNumCodes(value);
                            }}
                            style={{
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}
                        />
                        {codeType === CodeType.Reusable && <div style={{ textAlign: 'center', color: SECONDARY_TEXT }}>
                            <br />
                            <p>
                                <InfoCircleOutlined /> Note that this is a centralized solution. <Tooltip title="Reusable codes are handled in a centralized manner via the BitBadges servers (as opposed to the blockchain). Behind the scenes, we create X unique, decentralized codes and distribute them to whoever submits the correct password.">
                                    Hover to learn more.
                                </Tooltip>
                            </p>
                        </div>}
                    </div>
                </div>
            </div >,
            disabled: numCodes <= 0 || (codeType === CodeType.Reusable && codePassword.length === 0),
        } : distributionMethod === DistributionMethod.FirstComeFirstServe ? {
            title: `Max Claims (${numCodes})`,
            description: < div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ minWidth: 500 }} >
                    <br />
                    <div className='flex-between' style={{ flexDirection: 'column' }} >

                        <b>Max Claims</b>
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
            disabled: numCodes <= 0 || (codeType === CodeType.Reusable && codePassword.length === 0),
        } :
            {
                title: `Recipients(${toAddresses.length})`,
                description: <AddressListSelect
                    users={toAddresses}
                    setUsers={setToAddresses}
                    disallowedUsers={isWhitelist ? undefined : forbiddenUsersMap}
                    darkMode
                />,
                disabled: firstStepDisabled || !canTransfer,
            },
        {
            title: 'Badges',
            description: <div>
                <br />

                <IdRangesInput
                    idRanges={balances[0]?.badgeIds || []}
                    // defaultAllSelected={false}
                    setIdRanges={(badgeIds) => {
                        setBalances([
                            {
                                balance: balances[0]?.balance || 0,
                                badgeIds
                            }
                        ]);
                    }}
                    minimum={1}
                    maximum={collection?.nextBadgeId ? collection?.nextBadgeId - 1 : undefined}
                    showIncrementSelect={showIncrementSelect && numRecipients > 1}
                    darkMode
                    collection={collection}
                />
            </div>,
            disabled: idRangesOverlap || idRangesLengthEqualsZero || firstStepDisabled || !canTransfer,
        },
        {
            title: 'Amounts',
            description: <div>
                {numRecipients > 1 && <div>
                    {balances[0]?.badgeIds && (increment ? increment : 0) >= 0 && setIncrement && <div>
                        {numRecipients > 1 && <div>
                            <SwitchForm
                                options={[{
                                    title: 'All',
                                    message: 'All selected badge IDs will be sent to each recipient.',
                                    isSelected: amountSelectType === AmountSelectType.Custom,
                                },
                                {
                                    title: 'Increment',
                                    message: `After each transaction, the claimable badge IDs will be incremented by X before the next transaction.`,
                                    isSelected: amountSelectType === AmountSelectType.Linear,
                                }]}
                                onSwitchChange={(_option, title) => {
                                    if (_option === 0) {
                                        setAmountSelectType(AmountSelectType.Custom);
                                        setIncrement(0);
                                        setErrorMessage('');
                                        setWarningMessage('');
                                    } else {
                                        setAmountSelectType(AmountSelectType.Linear);
                                        setIncrement(1);
                                    }
                                }}
                            />
                        </div>}


                        {amountSelectType === AmountSelectType.Linear && < div >
                            <NumberInput
                                value={increment ? increment : 0}
                                setValue={setIncrement}
                                darkMode
                                min={1}
                                title="Increment"
                            />

                            <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                                <div>
                                    <div style={{ marginLeft: 8 }}>
                                        {increment === 0 && 'All recipients will receive all of the previously selected badge IDs.'}
                                        {increment ? `The first recipient to claim will receive the badge IDs ${balances[0]?.badgeIds.map(({ start, end }) => `${start}-${start + increment - 1}`).join(', ')}.` : ''}
                                    </div>
                                    <div style={{ marginLeft: 8 }}>

                                        {increment ? `The second recipient to claim will receive the badge IDs ${balances[0]?.badgeIds.map(({ start, end }) => `${start + increment}-${start + increment + increment - 1}`).join(', ')}.` : ''}

                                    </div>

                                    {numRecipients > 3 && <div style={{ marginLeft: 8 }}>
                                        <div style={{ marginLeft: 8 }}>
                                            {increment ? `...` : ''}
                                        </div>
                                    </div>}
                                    {numRecipients > 2 && <div style={{ marginLeft: 8 }}>
                                        <div style={{ marginLeft: 8 }}>
                                            {increment ? `The ${numRecipients === 3 ? 'third' : numRecipients + 'th'} selected recipient to claim will receive the badge IDs ${balances[0]?.badgeIds.map(({ start, end }) => `${start + (numRecipients - 1) * increment}-${start + (numRecipients - 1) * increment + increment - 1}`).join(', ')}.` : ''}
                                        </div>
                                    </div>}
                                </div>
                            </div>
                            {increment !== 0 && increment !== ids.length / numRecipients && <div style={{ textAlign: 'center' }}>
                                <br />
                                {warningMessage &&
                                    <div style={{ textAlign: 'center' }}>
                                        <div>
                                            <WarningOutlined style={{ color: 'orange' }} />
                                            <span style={{ marginLeft: 8 }}>
                                                {warningMessage}. The undistributed badges will be deselected.
                                            </span>
                                        </div>
                                    </div>

                                }
                                {errorMessage &&
                                    <div style={{ textAlign: 'center' }}>
                                        <WarningOutlined style={{ color: 'red' }} />
                                        <span style={{ marginLeft: 8, color: 'red' }}>
                                            {errorMessage}
                                        </span>
                                    </div>
                                }
                                <br />
                            </div>}

                            <hr />
                        </div>}

                    </div>}

                </div>
                }

                < br />

                <BalancesInput
                    balances={balances}
                    setBalances={setBalances}
                    darkMode
                />

                {(numRecipients <= 1 || amountSelectType === AmountSelectType.Custom) && <div>
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
                        toCodes={distributionMethod !== DistributionMethod.Whitelist ? new Array(numCodes) : []}
                        hideAddresses
                    />
                </div>}
                <Divider />

                {
                    postTransferBalance && <div>
                        <BalanceBeforeAndAfter collection={collection} balance={preTransferBalance ? preTransferBalance : userBalance} newBalance={postTransferBalance} partyString='' beforeMessage='Before Transfer Is Added' afterMessage='After Transfer Is Added' />
                        {/* {transfers.length >= 1 && <p style={{ textAlign: 'center', color: SECONDARY_TEXT }}>*These balances assum.</p>} */}
                    </div>
                }
            </div >,
            disabled: idRangesOverlap || idRangesLengthEqualsZero || secondStepDisabled || errorMessage
        },
    ]

    if (distributionMethod) {
        TransferSteps.push({
            title: 'Time',
            description: <div>
                <b>Start</b>
                <DatePicker
                    showMinute
                    showTime
                    placeholder='Start Date'
                    value={currTimeRange.start ? moment(currTimeRange.start * 1000) : null}
                    style={{
                        width: '100%',
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                    }}
                    onChange={(_date, dateString) => {
                        setCurrTimeRange({
                            ...currTimeRange,
                            start: new Date(dateString).valueOf() / 1000,
                        });
                    }}
                />
                <br />
                <br />
                <b>End</b>
                <DatePicker
                    showMinute
                    showTime
                    placeholder='End Date'
                    value={currTimeRange.end ? moment(currTimeRange.end * 1000) : null}
                    style={{
                        width: '100%',
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                    }}
                    onChange={(_date, dateString) => {
                        setCurrTimeRange({
                            ...currTimeRange,
                            end: new Date(dateString).valueOf() / 1000,
                        });
                    }}
                />
            </div>,
            disabled: !currTimeRange.start || !currTimeRange.end || currTimeRange.start > currTimeRange.end,
        })
    }


    TransferSteps.push({
        title: 'Confirm',
        description: <div>
            <TransferDisplay
                setTransfers={setTransfers}
                transfers={transfersToAdd}
                collection={collection}
                fontColor={PRIMARY_TEXT}
                toCodes={distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe ? new Array(numCodes ? numCodes / (transfersToAdd.length ? transfersToAdd.length : 1) : 0) : []}
                from={[sender]}
            />
            <br />
            <Button type='primary'
                style={{ width: '100%' }}
                onClick={async () => {
                    setTransfers([...transfers, ...transfersToAdd]);
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
                Add Transfer(s)
            </Button>
        </div>,
        disabled: false
    });


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
                    : <>
                        {plusButton ? <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Avatar
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setAddTransferIsVisible(true);
                                }}
                                src={<PlusOutlined />}
                                className='screen-button'
                            >
                            </Avatar>
                        </div> :
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                    </>}
            <br />
        </div>
    </div >



}