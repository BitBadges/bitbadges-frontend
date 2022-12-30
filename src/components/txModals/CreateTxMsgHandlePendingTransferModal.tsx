import React, { useEffect, useState } from 'react';
import { MessageMsgHandlePendingTransfer, createTxMsgHandlePendingTransfer } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Avatar, Button, Col, Divider, Empty, Row, Tooltip, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, SwapOutlined, SwapRightOutlined } from '@ant-design/icons';
import { BadgeAvatar } from '../BadgeAvatar';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { Address } from '../Address';
import Blockies from 'react-blockies'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
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
    const [otherPending, setOtherPending] = useState<any[]>([]);


    const txCosmosMsg: MessageMsgHandlePendingTransfer = {
        creator: chain.cosmosAddress,
        accept,
        badgeId: badge.id,
        forcefulAccept,
        nonceRanges
    };

    const addToPendingNonceRanges = (nonce: number, _accept: boolean, _forcefulAccept: boolean) => {
        //TODO: make this more optimal
        console.log(_accept, accept, _forcefulAccept, forcefulAccept);
        console.log(nonceRanges);
        let currNonceRanges = _accept != accept || _forcefulAccept != forcefulAccept ? [] : [...nonceRanges];
        let found = false;
        for (const range of currNonceRanges) {
            if (!range.end) range.end = range.start;

            if (range.start <= nonce && range.end >= nonce) {
                found = true;
                break;
            }
        }
        if (!found) {
            currNonceRanges.push({ start: nonce, end: nonce });
        }
        console.log(currNonceRanges);
        setNonceRanges(currNonceRanges);
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
                (e.g. can not mix approves and cancels).
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
                            <br />
                            <br />

                            <Row>
                                <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <Blockies scale={3} seed={chain.address ? chain.address.toLowerCase() : ''} />
                                        <Address fontSize={14} chain={chain.chain} hideChain address={pending.from === chain.accountNumber ? chain.address : ''} />
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <Blockies scale={3} seed={chain.address ? chain.address.toLowerCase() : ''} />
                                        <Address fontSize={14} chain={chain.chain} hideChain address={pending.from === chain.accountNumber ? chain.address : ''} />
                                    </div>
                                </Col>
                                <Col span={2} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </Col>

                                <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <Blockies scale={3} seed={chain.address ? chain.address.toLowerCase() : ''} />
                                        <Address fontSize={14} chain={chain.chain} hideChain address={pending.to === chain.accountNumber ? chain.address : ''} />
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <Blockies scale={3} seed={chain.address ? chain.address.toLowerCase() : ''} />
                                        <Address fontSize={14} chain={chain.chain} hideChain address={pending.to === chain.accountNumber ? chain.address : ''} />
                                    </div>
                                </Col>
                            </Row>
                            <br />
                            <div style={{ textAlign: 'center' }}>
                                <Typography.Text style={{ fontSize: 16, textAlign: 'center' }} strong>{'x' + pending.amount + ' of the following badges (IDs ' + pending.subbadgeRange.start + ' - ' + pending.subbadgeRange.end + '):'}</Typography.Text>
                            </div>
                            {
                                < div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                }}
                                >
                                    {badge && pending.subbadgeRange.end - pending.subbadgeRange.start + 1 > 0
                                        && pending.subbadgeRange.end >= 0 &&
                                        pending.subbadgeRange.start >= 0
                                        && new Array(pending.subbadgeRange.end - pending.subbadgeRange.start + 1).fill(0).map((_, idx) => {
                                            return <div key={idx} style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                            >
                                                <BadgeAvatar
                                                    badge={badge}
                                                    metadata={badge.badgeMetadata[idx + pending.subbadgeRange.start]}
                                                    badgeId={idx + pending.subbadgeRange.start}
                                                />
                                            </div>
                                        })}
                                </div >
                            }
                            <br />
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
                                                addToPendingNonceRanges(pending.thisPendingNonce, false, false);
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
                                                        addToPendingNonceRanges(pending.thisPendingNonce, true, true);
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
                                                        addToPendingNonceRanges(pending.thisPendingNonce, true, false);
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
                                                        addToPendingNonceRanges(pending.thisPendingNonce, true, true);
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
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Handle Pending Transfer(s)"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgHandlePendingTransfer}
        // displayMsg={<div>You are accepting a pending transfer of a badge.</div>}
        >
            {children}
        </TxModal>
    );
}