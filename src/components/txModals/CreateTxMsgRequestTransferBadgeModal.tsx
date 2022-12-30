import React, { useEffect, useState } from 'react';
import { MessageMsgRequestTransferBadge, MessageMsgTransferBadge, createTxMsgRequestTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, BitBadgesUserInfo, IdRange, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { InputNumber, Typography } from 'antd';
import { getAccountInformation, getBadgeBalance } from '../../bitbadges-api/api';
import { BadgeAvatar } from '../BadgeAvatar';
import { getPostTransferBalance } from '../../bitbadges-api/balances';


export function CreateTxMsgRequestTransferBadgeModal({ badge, visible, setVisible, children, balance }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        balance: UserBalance,
    }) {
    const chain = useChainContext();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>();

    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startSubbadgeId, setStartSubbadgeId] = useState<number>(-1);
    const [endSubbadgeId, setEndSubbadgeId] = useState<number>(-1);

    const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);

    const [requestedBalance, setRequestedBalance] = useState<UserBalance>();

    const [newBalance, setNewBalance] = useState<UserBalance>(balance);

    useEffect(() => {
        if (!requestedBalance || !requestedBalance.balanceAmounts) return;

        setNewBalance(getPostTransferBalance(requestedBalance, badge, startSubbadgeId, endSubbadgeId, amountToTransfer, 1));
    }, [amountToTransfer, startSubbadgeId, endSubbadgeId, badge, requestedBalance])

    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            if (!badge || !currUserInfo?.accountNumber || currUserInfo?.accountNumber < 0 || !badge.id) {
                return;
            }
            const balanceInfoRes = await getBadgeBalance(badge.id, currUserInfo?.accountNumber);

            if (balanceInfoRes.error) {
                console.error("Error getting balance: ", balanceInfoRes.error);
            } else {
                console.log("Got balance: ", balanceInfoRes.balanceInfo);
                const balanceInfo = balanceInfoRes.balanceInfo;
                setRequestedBalance(balanceInfo)
            }
        }
        getBadgeBalanceFromApi();
    }, [badge, currUserInfo?.accountNumber])



    const txCosmosMsg: MessageMsgRequestTransferBadge = {
        creator: chain.cosmosAddress,
        from: currUserInfo?.accountNumber ? currUserInfo.accountNumber : -1,
        badgeId: badge.id,
        amount: amountToTransfer,
        subbadgeRanges,
        expiration_time: 0, //TODO:
        cantCancelBeforeTime: 0,
    };

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);
    }

    const onRegister = async () => {
        if (currUserInfo?.cosmosAddress) {
            const newAccountNumber = await getAccountInformation(currUserInfo.cosmosAddress).then((accountInfo) => {
                return accountInfo.account_number;
            });
            setCurrUserInfo({ ...currUserInfo, accountNumber: newAccountNumber });
        }
    }


    useEffect(() => {
        setSubbadgeRanges([]);
        setAmountToTransfer(0);
        setStartSubbadgeId(-1);
        setEndSubbadgeId(-1);
    }, [visible])

    const firstStepDisabled = !currUserInfo || !currUserInfo.cosmosAddress;
    const secondStepDisabled = amountToTransfer <= 0 || startSubbadgeId < 0 || endSubbadgeId < 0 || startSubbadgeId > endSubbadgeId || !!newBalance?.balanceAmounts.find((balance) => balance.balance < 0);;

    const items = [
        {
            title: `Select User to Request From`,
            description: <div>
                <AddressSelect onChange={handleChange} title={""} />
                {/* TODO: <Typography>
                    Want to request from the manager? Click here.
                </Typography> */}

            </div>,
            disabled: firstStepDisabled,
        },
        {
            title: 'Select IDs and Amounts',
            description: <div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Amount to Transfer:
                    <InputNumber
                        min={1}
                        title='Amount to Transfer'
                        value={amountToTransfer} onChange={
                            (value: number) => {
                                if (!value || value <= 0) {
                                    setAmountToTransfer(0);
                                }
                                else {
                                    setAmountToTransfer(value);
                                }
                            }
                        } />
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Badge ID Start:
                    <InputNumber
                        min={0}
                        max={endSubbadgeId}
                        value={startSubbadgeId} onChange={
                            (value: number) => {
                                setStartSubbadgeId(value);

                                if (value >= 0 && endSubbadgeId >= 0 && value <= endSubbadgeId) {
                                    setSubbadgeRanges([{ start: value, end: endSubbadgeId }]);
                                }
                            }
                        } />
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Badge ID End:
                    <InputNumber
                        min={0}
                        max={badge.nextSubassetId - 1}
                        title='Amount to Transfer'
                        value={endSubbadgeId} onChange={
                            (value: number) => {
                                setEndSubbadgeId(value);

                                if (startSubbadgeId >= 0 && value >= 0 && startSubbadgeId <= value) {
                                    setSubbadgeRanges([{ start: startSubbadgeId, end: value }]);
                                }
                            }
                        } />
                </div>
                <hr />
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                }}>

                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <b>Current</b>
                    </div>
                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <b>After Transfer</b>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                }}>

                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
                        {requestedBalance?.balanceAmounts?.map((balanceAmount) => {
                            return balanceAmount.id_ranges.map((idRange, idx) => {
                                return <div key={idx}>
                                    <>
                                        The requested user owns <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}><b>x{balanceAmount.balance}</b></span> of IDs {idRange.start} to {idRange.end}.<br />
                                    </>
                                </div>
                            })
                        })}
                    </div>
                    <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
                        {newBalance.balanceAmounts?.map((balanceAmount) => {
                            return balanceAmount.id_ranges.map((idRange, idx) => {
                                return <div key={idx}>
                                    <>
                                        The requested user will own <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}><b>x{balanceAmount.balance}</b></span> of IDs {idRange.start} to {idRange.end}.<br />
                                    </>
                                </div>
                            })
                        })}
                    </div>

                </div>
                {(!requestedBalance || requestedBalance.balanceAmounts?.length === 0) && <div style={{ textAlign: 'center' }}>
                    <span style={{ color: 'red' }}><b>No balance found for the requested user.</b></span>
                </div>}
                <hr />
                <div style={{ textAlign: 'center' }}>
                    You are requesting a transfer of a balance of x{amountToTransfer} for each of the following badges:
                </div>
                {
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                    >

                        {endSubbadgeId - startSubbadgeId + 1 > 0
                            && endSubbadgeId >= 0 &&
                            startSubbadgeId >= 0
                            && new Array(endSubbadgeId - startSubbadgeId + 1).fill(0).map((_, idx) => {
                                return <div key={idx} style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                                >
                                    <BadgeAvatar
                                        badge={badge}
                                        metadata={badge.badgeMetadata[idx + startSubbadgeId]}
                                        badgeId={idx + startSubbadgeId}
                                    />
                                </div>
                            })}
                    </div>
                }
            </div>,
            disabled: secondStepDisabled
        },
    ];

    let unregisteredUsers: string[] = [];
    if (currUserInfo && currUserInfo.cosmosAddress && currUserInfo.accountNumber < 0) {
        unregisteredUsers = [currUserInfo.cosmosAddress];
    }
    return (
        <TxModal
            onRegister={onRegister}
            unregisteredUsers={unregisteredUsers}
            msgSteps={items}
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Request Transfer Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRequestTransferBadge}
            displayMsg={
                <div style={{ textAlign: 'left' }}>
                    The requested user will have three options:
                    <ol>
                        <li>
                            Accept this request and complete the transfer themselves.
                        </li>
                        <li>
                            Approve this request,
                            and then, you can complete the transfer with a separate transaction.
                        </li>
                        <li>
                            Reject this request.
                        </li>
                    </ol>
                </div>
            }
        // disabled={currUserInfo === undefined || currUserInfo === null || currUserInfo.accountNumber < 0}
        >
            {children}
        </TxModal>
    );
}