import React, { useEffect, useState } from 'react';
import { MessageMsgHandlePendingTransfer, createTxMsgHandlePendingTransfer } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Avatar, Divider, Empty, Tooltip, Typography } from 'antd';
import { CheckOutlined, ClockCircleFilled, CloseOutlined, SwapOutlined } from '@ant-design/icons';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { TransferDisplay } from '../common/TransferDisplay';
const { Text } = Typography;

const getActionForNonce = (actions: number[], nonceRanges: IdRange[], nonce: number) => {
    for (let i = 0; i < nonceRanges.length; i++) {
        if (nonce >= nonceRanges[i].start && nonce <= nonceRanges[i].end) {
            if (actions.length == 1) {
                return actions[0];
            } else {
                return actions[i];
            }
        }
    }
    return -1;
}

export function CreateTxMsgHandlePendingTransferModal({ balance, badge, visible, setVisible, children }
    :
    {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        balance: UserBalance,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();

    const [actions, setActions] = useState<number[]>([]);
    const [nonceRanges, setNonceRanges] = useState<IdRange[]>([]);
    const [otherPending, setOtherPending] = useState<any[]>([]);

    // Reset states upon modal close
    useEffect(() => {
        if (!visible) {
            setActions([]);
            setNonceRanges([]);
        }
    }, [visible]);


    const txCosmosMsg: MessageMsgHandlePendingTransfer = {
        creator: chain.cosmosAddress,
        actions,
        badgeId: badge.id,
        nonceRanges
    };

    const addOrRemoveNonce = (nonce: number, _accept: boolean, _forcefulAccept: boolean) => {
        const action = _accept && !_forcefulAccept ? 1 : _accept && _forcefulAccept ? 2 : 0;
        let currNonceRanges = [...nonceRanges];
        let currActions = [...actions];

        let idx = -1;
        for (let i = 0; i < currNonceRanges.length; i++) {
            const range = currNonceRanges[i];
            if (!range.end) range.end = range.start;

            if (range.start <= nonce && range.end >= nonce) {
                idx = i;
                break;
            }
        }


        let prevAction = -1;
        if (idx !== -1) {
            prevAction = actions[idx];
            currNonceRanges = currNonceRanges.filter((_, i) => i !== idx);
            currActions = currActions.filter((_, i) => i !== idx);
        }

        //If we are selecting a new action, add it to the list
        //Else, we are deselecting an action, and we already removed it from the list
        if (prevAction !== action) {
            currNonceRanges.push({ start: nonce, end: nonce });
            currActions.push(action);
        }

        setNonceRanges(currNonceRanges);
        setActions(currActions);
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
                        let expirationMsg = '';
                        let cancelMsg = '';

                        if (outgoingTransfer) {
                            if (pending.sent) {
                                msg += 'Outgoing Transfer';
                                expirationMsg = 'They must accept by';
                                cancelMsg = 'You cannot cancel until';
                            } else {
                                msg += 'Request for Outgoing Transfer';
                                expirationMsg = 'You must accept by';
                                cancelMsg = 'They cannot cancel until';
                            }
                        } else {
                            if (pending.sent) {
                                if (otherPending[idx] && otherPending[idx].markedAsAccepted) {
                                    msg += `Request for Incoming Transfer: APPROVED`;
                                }
                                else {
                                    msg += `Request for Incoming Transfer: Pending`;
                                }
                                expirationMsg = 'They must accept by';
                                cancelMsg = 'You cannot cancel until';
                            } else {
                                msg += 'Incoming Transfer';
                                expirationMsg = 'You must accept by';
                                cancelMsg = 'They cannot cancel until';
                            }
                        }

                        return <>
                            {idx > 0 && <Divider />}
                            <Typography.Text style={{ fontSize: 16 }} strong>#{idx + 1}) {msg}</Typography.Text>
                            {pending.expirationTime && <><br /><Typography.Text><ClockCircleFilled /> {expirationMsg} {new Date(pending.expirationTime * 1000).toISOString()}</Typography.Text></>}
                            {pending.cantCancelBeforeTime && <><br /><Typography.Text><ClockCircleFilled /> {cancelMsg} {new Date(pending.expirationTime * 1000).toISOString()}</Typography.Text></>}
                            <br />
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
                                                border: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 0 ? `2px solid #1890ff` : undefined,
                                                color: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 0 ? `#1890ff` : undefined,
                                            }}
                                            size="large"
                                            onClick={() => {
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
                                                        border: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 2 ? `2px solid #1890ff` : undefined,
                                                        color: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 2 ? `#1890ff` : undefined,
                                                    }}
                                                    size="large"
                                                    onClick={() => {
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
                                                        border: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 1 ? `2px solid #1890ff` : pending.markedAsAccepted ? '1px solid green' : undefined,
                                                        color: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 1 ? `#1890ff` : pending.markedAsAccepted ? 'green' : undefined,
                                                    }}
                                                    size="large"
                                                    onClick={() => {
                                                        if (pending.markedAsAccepted) return;

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
                                                        border: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 2 ? `2px solid #1890ff` : undefined,
                                                        color: getActionForNonce(actions, nonceRanges, pending.thisPendingNonce) === 2 ? `#1890ff` : undefined,
                                                    }}
                                                    size="large"
                                                    onClick={() => {
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
        // displayMsg={`You have selected to ${accept ? forcefulAccept ? 'complete' : 'approve' : 'cancel/reject'} ${numHandling} pending transfer(s).`}
        >
            {children}
        </TxModal>
    );
}