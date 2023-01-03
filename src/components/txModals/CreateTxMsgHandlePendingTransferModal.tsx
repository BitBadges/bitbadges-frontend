import React, { useEffect, useState } from 'react';
import { MessageMsgHandlePendingTransfer, createTxMsgHandlePendingTransfer } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Avatar, Button, Col, Divider, Empty, Row, Tooltip, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, SwapOutlined, SwapRightOutlined } from '@ant-design/icons';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { TransferDisplay } from '../common/TransferDisplay';
const { Text } = Typography;

export function CreateTxMsgHandlePendingTransferModal({ balance, badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        balance: UserBalance,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();

    const [accept, setAccept] = useState<boolean>(true);
    const [forcefulAccept, setForcefulAccept] = useState<boolean>(false);
    const [nonceRanges, setNonceRanges] = useState<IdRange[]>([]);
    const [numHandling, setNumHandling] = useState<number>(0);
    const [otherPending, setOtherPending] = useState<any[]>([]);


    const txCosmosMsg: MessageMsgHandlePendingTransfer = {
        creator: chain.cosmosAddress,
        accept,
        badgeId: badge.id,
        forcefulAccept,
        nonceRanges
    };

    const addOrRemoveNonce = (nonce: number, _accept: boolean, _forcefulAccept: boolean) => {
        //TODO: make this more optimal
        let numHandled = numHandling;
        let currNonceRanges = _accept != accept || _forcefulAccept != forcefulAccept ? [] : [...nonceRanges];
        if (_accept != accept || _forcefulAccept != forcefulAccept) {
            numHandled = 0;
        }
        let idx = -1;
        for (let i = 0; i < currNonceRanges.length; i++) {
            const range = currNonceRanges[i];
            if (!range.end) range.end = range.start;

            if (range.start <= nonce && range.end >= nonce) {
                idx = i;
                break;
            }
        }
        if (idx === -1) {
            currNonceRanges.push({ start: nonce, end: nonce });
            numHandled++;
        } else {
            currNonceRanges = currNonceRanges.filter((_, i) => i !== idx);
            numHandled--;
        }
        setNonceRanges(currNonceRanges);
        setNumHandling(numHandled);
    }

    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            if (!balance.pending || balance.pending.length === 0) return;
            let otherPendingArr = [];
            for (const pending of balance.pending) {
                if (pending.from !== chain.accountNumber && pending.sent) {
                    const balanceInfoRes = await getBadgeBalance(badge.id, pending.from);

                    if (balanceInfoRes.error) {
                        console.error("Error getting other party's balance info: ", balanceInfoRes.error);
                    } else {
                        // console.log("Got balance: ", balanceInfoRes.balanceInfo);
                        const balanceInfo = balanceInfoRes.balanceInfo;
                        otherPendingArr.push(balanceInfo?.pending.find(p => p.thisPendingNonce === pending.otherPendingNonce));
                    }
                } else {
                    otherPendingArr.push([]);
                }
            }

            setOtherPending(otherPendingArr);
        }
        getBadgeBalanceFromApi();
    }, [balance.pending, chain.accountNumber, badge.id])



    const firstStepDisabled = nonceRanges.length === 0;

    const items = [
        {
            title: `Select Action(s)`,
            description: <>
                Currently, you can select more than one action but all actions have to be the same type
                (e.g. can not mix approves and cancels). You may select more than one action.
                <hr />
                {/* //TODO: fix this */}
                <br />
                {!balance.pending || balance.pending.length === 0 && <Empty
                    description="No pending transfers found."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />}
                {
                    balance.pending?.map((pending, idx) => {
                        if (pending.subbadgeRange.end === undefined) pending.subbadgeRange.end = pending.subbadgeRange.start;
                        pending.subbadgeRange.end = Number(pending.subbadgeRange.end);
                        pending.subbadgeRange.start = Number(pending.subbadgeRange.start);
                        let outgoingTransfer = pending.from === chain.accountNumber;

                        let msg = '';

                        if (outgoingTransfer) {
                            if (pending.sent) {
                                msg += 'Outgoing Transfer';
                            } else {
                                msg += 'Request for Outgoing Transfer';
                            }
                        } else {
                            if (pending.sent) {
                                if (otherPending[idx] && otherPending[idx].markedAsAccepted) {
                                    msg += `Request for Incoming Transfer: APPROVED`;
                                }
                                else {
                                    msg += `Request for Incoming Transfer: Pending`;
                                }
                            } else {
                                msg += 'Incoming Transfer';
                            }
                        }

                        return <>
                            {idx > 0 && <Divider />}
                            <Typography.Text style={{ fontSize: 16 }} strong>#{idx + 1}) {msg}</Typography.Text>
                            <TransferDisplay
                                from={[{
                                    address: chain.address,
                                    accountNumber: chain.accountNumber,
                                    chain: chain.chain,
                                    cosmosAddress: chain.cosmosAddress,
                                }]}
                                to={[{
                                    address: chain.address,
                                    accountNumber: chain.accountNumber,
                                    chain: chain.chain,
                                    cosmosAddress: chain.cosmosAddress,
                                }]}
                                badge={badge}
                                amount={pending.amount}
                                startId={pending.subbadgeRange.start}
                                endId={pending.subbadgeRange.end}
                            />
                            <div
                                style={{
                                    width: '100%',
                                    padding: '10',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 8,
                                    marginBottom: 30,
                                }}
                            >
                                <Tooltip style={{ textAlign: 'center' }}
                                    title={<div style={{ textAlign: 'center' }}>
                                        {pending.sent ? 'Cancel this transfer.' : 'Reject this transfer.'}
                                    </div>}>
                                    <div style={{ minWidth: 75, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                                        <Avatar
                                            style={{
                                                marginBottom: 1,
                                                // marginLeft: 8,
                                                // marginRight: 8,
                                                cursor: 'pointer',
                                                fontSize: 20,
                                                padding: 0,
                                                margin: 0,
                                                alignItems: 'center',
                                                border: !accept && nonceRanges.find(idRange => {
                                                    if (idRange.end === undefined) idRange.end = idRange.start;
                                                    return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                }) ? `1px solid #1890ff` : undefined,
                                                color: !accept && nonceRanges.find(idRange => {
                                                    if (idRange.end === undefined) idRange.end = idRange.start;
                                                    return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                }) ? `#1890ff` : undefined,
                                            }}
                                            size="large"
                                            onClick={() => {
                                                setAccept(false);
                                                setForcefulAccept(false);
                                                addOrRemoveNonce(pending.thisPendingNonce, false, false);
                                            }}
                                            className="screen-button-modal"
                                        >
                                            <CloseOutlined />
                                        </Avatar>
                                        <div style={{ marginTop: 3 }}>
                                            <Text>
                                                {pending.sent ? 'Cancel' : 'Reject'}
                                            </Text>
                                        </div>
                                    </div>
                                </Tooltip>
                                {
                                    (!outgoingTransfer && (!pending.sent || (pending.sent && otherPending[idx] && otherPending[idx].markedAsAccepted)))
                                    && <>
                                        <Tooltip
                                            style={{ textAlign: 'center' }}
                                            title={<div style={{ textAlign: 'center' }}>
                                                Accept and complete this transfer.
                                            </div>}>
                                            <div style={{ minWidth: 75, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                                                <Avatar
                                                    style={{
                                                        // marginLeft: 8,
                                                        // marginRight: 8,
                                                        marginBottom: 1,
                                                        cursor: 'pointer',
                                                        fontSize: 20,
                                                        padding: 0,
                                                        margin: 0,
                                                        alignItems: 'center',
                                                        border: accept && forcefulAccept && nonceRanges.find(idRange => {
                                                            if (idRange.end === undefined) idRange.end = idRange.start;
                                                            return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                        }) ? `1px solid #1890ff` : undefined,
                                                        color: accept && forcefulAccept && nonceRanges.find(idRange => {
                                                            if (idRange.end === undefined) idRange.end = idRange.start;
                                                            return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                        }) ? `#1890ff` : undefined,
                                                    }}
                                                    size="large"
                                                    onClick={() => {
                                                        setAccept(true);
                                                        setForcefulAccept(true);
                                                        addOrRemoveNonce(pending.thisPendingNonce, true, true);
                                                    }}
                                                    className="screen-button-modal"
                                                >
                                                    <SwapOutlined />
                                                </Avatar>

                                                <div style={{ marginTop: 3 }}>
                                                    <Text>
                                                        Transfer
                                                    </Text>
                                                </div>
                                            </div>
                                        </Tooltip>
                                    </>
                                }

                                {
                                    ((!pending.sent && outgoingTransfer))
                                    && <>
                                        <Tooltip style={{ textAlign: 'center' }}
                                            title={<div style={{ textAlign: 'center' }}>
                                                {pending.markedAsAccepted ? 'You have already approved this transfer. The requester can now complete the transfer.' :
                                                    'Approve the requester to complete this transfer. They will pay the transfer fees.'}
                                            </div>}>
                                            <div style={{ minWidth: 75, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                                                <Avatar
                                                    style={{
                                                        marginLeft: 8,
                                                        // marginRight: 8,
                                                        marginBottom: 1,
                                                        cursor: pending.markedAsAccepted ? 'not-allowed' : 'pointer',
                                                        fontSize: 20,
                                                        padding: 0,
                                                        margin: 0,
                                                        alignItems: 'center',
                                                        border: accept && !forcefulAccept && nonceRanges.find(idRange => {
                                                            if (idRange.end === undefined) idRange.end = idRange.start;
                                                            return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                        }) ? `1px solid #1890ff` : pending.markedAsAccepted ? '1px solid green' : undefined,
                                                        color: accept && !forcefulAccept && nonceRanges.find(idRange => {
                                                            if (idRange.end === undefined) idRange.end = idRange.start;
                                                            return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                        }) ? `#1890ff` : pending.markedAsAccepted ? 'green' : undefined,
                                                    }}
                                                    size="large"
                                                    onClick={() => {
                                                        if (pending.markedAsAccepted) return;

                                                        setAccept(true);
                                                        setForcefulAccept(false);
                                                        addOrRemoveNonce(pending.thisPendingNonce, true, false);
                                                    }}
                                                    className="screen-button-modal"
                                                >
                                                    <CheckOutlined />
                                                </Avatar>
                                                <div style={{ marginTop: 3 }}>
                                                    <Text>
                                                        Approve
                                                    </Text>
                                                </div>
                                            </div>
                                        </Tooltip>

                                        <Tooltip
                                            style={{ textAlign: 'center' }}
                                            title={<div style={{ textAlign: 'center' }}>
                                                Accept this transfer request and complete the transfer yourself.
                                            </div>}>
                                            <div style={{ minWidth: 75, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                                                <Avatar
                                                    style={{
                                                        // marginLeft: 8,
                                                        // marginRight: 8,
                                                        marginBottom: 1,
                                                        cursor: 'pointer',
                                                        fontSize: 20,
                                                        padding: 0,
                                                        margin: 0,
                                                        alignItems: 'center',
                                                        border: accept && forcefulAccept && nonceRanges.find(idRange => {
                                                            if (idRange.end === undefined) idRange.end = idRange.start;
                                                            return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                        }) ? `1px solid #1890ff` : undefined,
                                                        color: accept && forcefulAccept && nonceRanges.find(idRange => {
                                                            if (idRange.end === undefined) idRange.end = idRange.start;
                                                            return pending.thisPendingNonce >= idRange.start && pending.thisPendingNonce <= idRange.end;
                                                        }) ? `#1890ff` : undefined,
                                                    }}
                                                    size="large"
                                                    onClick={() => {
                                                        setAccept(true);
                                                        setForcefulAccept(true);
                                                        addOrRemoveNonce(pending.thisPendingNonce, true, true);
                                                    }}
                                                    className="screen-button-modal"
                                                >
                                                    <SwapOutlined />
                                                </Avatar>

                                                <div style={{ marginTop: 3 }}>
                                                    <Text>
                                                        Transfer
                                                    </Text>
                                                </div>
                                            </div>
                                        </Tooltip>
                                    </>
                                }
                            </div>
                        </>
                    })
                }</>,
            disabled: firstStepDisabled,
        },
    ];



    return (
        <TxModal
            msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Handle Pending Transfer(s)"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgHandlePendingTransfer}
            displayMsg={`You have selected to ${accept ? forcefulAccept ? 'complete' : 'approve' : 'cancel/reject'} ${numHandling} pending transfer(s).`}
        >
            {children}
        </TxModal>
    );
}