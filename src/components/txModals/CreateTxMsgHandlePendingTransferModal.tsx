import React, { useState } from 'react';
import { MessageMsgHandlePendingTransfer, createTxMsgHandlePendingTransfer } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Avatar, Button, Col, Row, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';

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

    const txCosmosMsg: MessageMsgHandlePendingTransfer = {
        creator: chain.cosmosAddress,
        accept,
        badgeId: badge.id,
        forcefulAccept,
        nonceRanges
    };

    const firstStepDisabled = nonceRanges.length === 0;

    const items = [
        {
            title: `Select Pending Transfer`,
            description: <>{
                balance.pending?.map((pending, idx) => {
                    if (pending.end === undefined) pending.end = pending.start;
                    let outgoingTransfer = pending.from === chain.accountNumber;

                    let msg = '';
                    if (outgoingTransfer) {
                        msg += 'Sending x' + pending.amount + ' badges w/ IDs ' + pending.subbadgeRange.start + ' - ' + pending.subbadgeRange.end + ' to Account #' + pending.to + '';
                    } else {
                        msg += 'Receiving x' + pending.amount + ' badges w/ IDs ' + pending.subbadgeRange.start + ' - ' + pending.subbadgeRange.end + ' from Account #' + pending.from + '';
                    }


                    return <>
                        {idx + 1}) {msg}
                        <br />
                        {
                            ((!pending.sent && !outgoingTransfer) ||
                                (!pending.sent && outgoingTransfer && !pending.markedAsAccepted) ||
                                (pending.sent && !outgoingTransfer)) //TODO: check other party for accepted
                            &&
                            <Tooltip title="Accept">
                                <Avatar
                                    style={{
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
                                        setNonceRanges([{
                                            start: pending.thisPendingNonce,
                                            end: pending.thisPendingNonce,
                                        }]);
                                    }}
                                    className="screen-button-modal"
                                >
                                    <CheckOutlined />
                                </Avatar>
                            </Tooltip>
                        }

                        <Tooltip title="Reject/Cancel">
                            <Avatar
                                style={{
                                    marginBottom: 1,
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
                                    setNonceRanges([{
                                        start: pending.thisPendingNonce,
                                        end: pending.thisPendingNonce,
                                    }]);
                                }}
                                className="screen-button-modal"
                            >
                                <CloseOutlined />
                            </Avatar>
                        </Tooltip>
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
            txName="Handle Pending Transfer"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgHandlePendingTransfer}
            displayMsg={<div>You are accepting a pending transfer of a badge.</div>}
        >
            {children}
        </TxModal>
    );
}