import { CloseOutlined, InfoCircleOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Button, DatePicker, Divider, Input, InputNumber, StepProps, Steps, Tooltip } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { checkIfApproved, getMatchingAddressesFromTransferMapping, getIdRangesForAllBadgeIdsInCollection } from '../../bitbadges-api/badges';
import { getBalanceAfterTransfers, getBlankBalance } from '../../bitbadges-api/balances';
import { checkIfIdRangesOverlap } from '../../bitbadges-api/idRanges';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, DistributionMethod, IdRange, TransfersExtended, UserBalance } from '../../bitbadges-api/types';
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
    Increment,
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
    updateMetadataForBadgeIds
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
    updateMetadataForBadgeIds?: (badgeIds: number[]) => void;
}) {
    const chain = useChainContext();

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [amountSelectType, setAmountSelectType] = useState(AmountSelectType.None);
    const [addTransferIsVisible, setAddTransferIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [codeType, setCodeType] = useState(CodeType.None);
    const [currTimeRange, setCurrTimeRange] = useState<IdRange>({ start: 0, end: 0 });
    const [numCodes, setNumCodes] = useState<number>(0);
    const [balances, setBalances] = useState<Balance[]>([
        {
            balance: 1,
            badgeIds: getIdRangesForAllBadgeIdsInCollection(collection)
        },
    ]);
    const [postTransferBalance, setPostTransferBalance] = useState<UserBalance>();
    const [preTransferBalance, setPreTransferBalance] = useState<UserBalance>();

    const [transfersToAdd, setTransfersToAdd] = useState<TransfersExtended[]>([]);
    const [increment, setIncrement] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [warningMessage, setWarningMessage] = useState<string>('');

    const [codePassword, setCodePassword] = useState<string>('');

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    const numRecipients = !distributionMethod || distributionMethod === DistributionMethod.Whitelist ? toAddresses.length : numCodes;

    let totalNumBadges = 0;
    for (const balance of balances) {
        for (const badgeIdRange of balance.badgeIds) {
            totalNumBadges += badgeIdRange.end - badgeIdRange.start + 1;
        }
    }



    useEffect(() => {
        if (numRecipients === 0) return;

        const incrementIsSelected = amountSelectType === AmountSelectType.Increment;
        let newTransfersToAdd: TransfersExtended[] = [];

        //We have a couple combinations here
        //1. Normal transfer - no increments, can be used with everything (codes, direct transfers, whitelist, etc)
        //2. Increment IDs after every claim/transfer - for claims (whitelist, code, etc.), this supports numIncrements / incrementIdsBy, but for direct transfers, we need to add N unique transfers with each increment manually added

        // If we are not using increments, then we can just add the transfers as is (normal transfer)
        if (!incrementIsSelected) {
            console.log("!incrementIsSelected")
            console.log(toAddresses);
            newTransfersToAdd = [{
                toAddresses: toAddresses.map((user) => user.accountNumber),
                balances: balances,
                toAddressInfo: toAddresses.map((user) => user),
                numCodes: numCodes,
                numIncrements: 0,
                incrementBy: 0,
                password: codePassword,
                timeRange: currTimeRange
            }];
        } else if (amountSelectType === AmountSelectType.Increment) {
            let numPerAddress = increment;

            checkForErrorsAndWarnings();

            let startingBadgeIds: IdRange[] = [];
            for (const balance of balances) {
                for (const badgeIdRange of balance.badgeIds) {
                    startingBadgeIds.push({
                        start: badgeIdRange.start,
                        end: badgeIdRange.start + increment - 1,
                    });
                }
            }

            //If we are using increments and directly transferring, then we need to add N unique transfers with each increment manually added
            if (manualSend) {
                let currBadgeIds = JSON.parse(JSON.stringify([...startingBadgeIds]));
                //Add N transfers, each with a different increment
                for (let i = 0; i < numRecipients; i++) {
                    newTransfersToAdd.push({
                        toAddresses: [toAddresses[i].accountNumber],
                        balances: [{
                            balance: balances[0]?.balance || 1,
                            badgeIds: JSON.parse(JSON.stringify([...currBadgeIds])),
                        }],
                        toAddressInfo: [toAddresses[i]],
                        numCodes: 0,
                        numIncrements: 0,
                        incrementBy: 0,
                        password: codePassword,
                        timeRange: distributionMethod ? currTimeRange : undefined
                    });

                    //Increment the badge IDs for the next transfer
                    for (let j = 0; j < currBadgeIds.length; j++) {
                        currBadgeIds[j].start += increment;
                        currBadgeIds[j].end += increment;
                    }
                }
            } else {
                //Else, we can just add the transfer with increments and it'll be handled
                newTransfersToAdd.push({
                    toAddresses: toAddresses.map((user) => user.accountNumber),
                    balances: [{
                        balance: balances[0]?.balance || 1,
                        badgeIds: startingBadgeIds,
                    }],
                    toAddressInfo: toAddresses,
                    numCodes: numCodes,
                    numIncrements: numRecipients,
                    incrementBy: numPerAddress,
                    password: codePassword,
                    timeRange: distributionMethod ? currTimeRange : undefined
                });
            }
        }

        setTransfersToAdd(newTransfersToAdd);
    }, [amountSelectType, numRecipients, balances, toAddresses, distributionMethod, numCodes, increment, showIncrementSelect, manualSend, codePassword, currTimeRange]);


    const checkForErrorsAndWarnings = () => {
        let errorMessage = '';
        let warningMessage = '';
        for (const balance of balances) {
            for (const badgeIdRange of balance.badgeIds) {
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
        setErrorMessage(errorMessage);
        setWarningMessage(warningMessage);
    }

    //Whenever something changes, update the pre and post transfer balances
    useEffect(() => {
        //Calculate from beginning
        let postTransferBalanceObj = { ...userBalance };
        let preTransferBalanceObj = { ...userBalance };

        if (!postTransferBalanceObj || postTransferBalanceObj === getBlankBalance()) return;
        if (!preTransferBalanceObj || preTransferBalanceObj === getBlankBalance()) return;

        //Deduct transfers to add
        postTransferBalanceObj = getBalanceAfterTransfers(postTransferBalanceObj, [...transfersToAdd]);

        setPostTransferBalance(postTransferBalanceObj);
        setPreTransferBalance(preTransferBalanceObj);
    }, [userBalance, chain.accountNumber, sender.accountNumber, transfers, transfersToAdd, distributionMethod, amountSelectType, numCodes, toAddresses, balances]);

    const forbiddenAddresses = getMatchingAddressesFromTransferMapping(collection.disallowedTransfers, toAddresses, chain, collection.manager.accountNumber);
    const managerApprovedAddresses = getMatchingAddressesFromTransferMapping(collection.managerApprovedTransfers, toAddresses, chain, collection.manager.accountNumber);

    //If sender !== current user, check if they have any approvals. 
    const unapprovedAddresses: any[] = [];
    if (chain.accountNumber !== sender.accountNumber) {
        const isApproved = checkIfApproved(userBalance, chain.accountNumber, balances);

        if (!isApproved) {
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

    const firstStepDisabled = distributionMethod && distributionMethod !== DistributionMethod.Whitelist ? numCodes <= 0 : toAddresses.length === 0;
    const secondStepDisabled = balances.length == 0 || !!postTransferBalance?.balances?.find((balance) => balance.balance < 0);

    const idRangesOverlap = checkIfIdRangesOverlap(balances[0].badgeIds);
    const idRangesLengthEqualsZero = balances[0].badgeIds.length === 0;

    const TransferSteps: StepProps[] = [];

    //Add first step
    if (distributionMethod === DistributionMethod.Codes) {
        TransferSteps.push({
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
                            min={0}
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
                        <div style={{ textAlign: 'center', color: SECONDARY_TEXT }}>
                            <br />
                            <p>
                                <InfoCircleOutlined /> Note that this is a centralized solution. <Tooltip title="For a better user experience, codes are stored in a centralized manner via the BitBadges servers (as opposed to the blockchain). This eliminates any storage requirements for collection creators. For a decentralized solution, you can interact directly with the blockchain.">
                                    Hover to learn more.
                                </Tooltip>
                            </p>
                        </div>
                    </div>
                </div>
            </div >,
            disabled: numCodes <= 0 || (codeType === CodeType.Reusable && codePassword.length === 0),
        });
    } else if (distributionMethod === DistributionMethod.FirstComeFirstServe) {
        TransferSteps.push({
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
        });
    } else {
        TransferSteps.push({
            title: `Recipients (${toAddresses.length})`,
            description: <AddressListSelect
                users={toAddresses}
                setUsers={setToAddresses}
                disallowedUsers={isWhitelist ? undefined : forbiddenUsersMap}
                darkMode
            />,
            disabled: firstStepDisabled || !canTransfer,
        });
    }

    //Add second step
    TransferSteps.push({
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
                darkMode
                collection={collection}
                updateMetadataForBadgeIds={updateMetadataForBadgeIds}
            />
        </div>,
        disabled: idRangesOverlap || idRangesLengthEqualsZero || firstStepDisabled || !canTransfer,
    });

    //Add third step
    TransferSteps.push({
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
                                isSelected: amountSelectType === AmountSelectType.Increment,
                            }]}
                            onSwitchChange={(_option, title) => {
                                if (_option === 0) {
                                    setAmountSelectType(AmountSelectType.Custom);
                                    setIncrement(0);
                                    setErrorMessage('');
                                    setWarningMessage('');
                                } else {
                                    setAmountSelectType(AmountSelectType.Increment);
                                    setIncrement(1);
                                }
                            }}
                        />
                    </div>}


                    {amountSelectType === AmountSelectType.Increment && < div >
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
                        {increment !== 0 && increment !== totalNumBadges / numRecipients && <div style={{ textAlign: 'center' }}>
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
                    transfers={transfersToAdd}
                    collection={collection}
                    fontColor={PRIMARY_TEXT}
                    from={[sender]}
                    setTransfers={setTransfers}
                    hideAddresses
                    updateMetadataForBadgeIds={updateMetadataForBadgeIds}
                />
            </div>}
            <Divider />

            {
                postTransferBalance && <div>
                    <BalanceBeforeAndAfter collection={collection} balance={preTransferBalance ? preTransferBalance : userBalance} newBalance={postTransferBalance} partyString='' beforeMessage='Before Transfer Is Added' afterMessage='After Transfer Is Added' updateMetadataForBadgeIds={updateMetadataForBadgeIds} />
                    {/* {transfers.length >= 1 && <p style={{ textAlign: 'center', color: SECONDARY_TEXT }}>*These balances assum.</p>} */}
                </div>
            }
        </div >,
        disabled: idRangesOverlap || idRangesLengthEqualsZero || secondStepDisabled || errorMessage ? true : false,
    });

    //Add time select step
    if (distributionMethod && !manualSend) {
        TransferSteps.push({
            title: 'Time',
            description: <div>

                <div style={{ textAlign: 'center', color: PRIMARY_TEXT, marginTop: 4 }}>
                    <h3 style={{ textAlign: 'center', color: PRIMARY_TEXT }}>When can the recipients claim?</h3>
                </div>

                <b>Start Time</b>
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
                <b>End Time</b>
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
                from={[sender]}
                updateMetadataForBadgeIds={updateMetadataForBadgeIds}
            />
            <br />
            <Button type='primary'
                style={{ width: '100%' }}
                onClick={async () => {
                    setTransfers([...transfersToAdd]);
                    setToAddresses([]);
                    setBalances([
                        {
                            balance: 1,
                            badgeIds: getIdRangesForAllBadgeIdsInCollection(collection)
                        },
                    ]);
                    setAmountSelectType(AmountSelectType.None);
                    setIncrement(0);

                    setAddTransferIsVisible(false);
                    setCurrentStep(0);
                }}>
                Add Transfer(s)
            </Button>
            {distributionMethod === DistributionMethod.Codes && !codePassword &&
                <div style={{ textAlign: 'center', color: SECONDARY_TEXT, justifyContent: 'center', display: 'flex', width: '100%' }}>
                    <h5 style={{ color: PRIMARY_TEXT }}>Once this collection has been created, you (the manager) can fetch the codes via the Claims tab.</h5>
                </div>}
        </div>,
        disabled: false
    });


    return <div style={{ width: 800, alignItems: 'center', color: PRIMARY_TEXT }}>
        <div>
            {
                !addTransferIsVisible && !hideTransferDisplay && <div>
                    <div className='flex-between'>
                        <div></div>
                        <h2 style={{ textAlign: 'center', color: PRIMARY_TEXT }}>Transfers Added ({transfers.length})</h2>
                        <div></div>
                    </div>

                    <TransferDisplay
                        transfers={transfers}
                        setTransfers={setTransfers}
                        collection={collection}
                        fontColor={PRIMARY_TEXT}
                        from={[sender]}
                        deletable
                        updateMetadataForBadgeIds={updateMetadataForBadgeIds}
                    />
                    <Divider />
                    <hr />
                    <br />

                </div>
            }

            {
                addTransferIsVisible ?

                    <div>
                        < div className='flex-between' >
                            <div></div>

                            <h2 style={{ textAlign: 'center', color: PRIMARY_TEXT }}>Add {distributionMethod ? 'Claim' : 'Transfer'}?</h2>
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