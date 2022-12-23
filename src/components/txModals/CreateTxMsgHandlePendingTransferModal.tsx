import React, { useEffect, useState } from 'react';
import { MessageMsgHandlePendingTransfer, MessageMsgTransferBadge, createTxMsgHandlePendingTransfer, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, User } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber } from 'antd';
import { AddressModalDisplay } from './AddressModalDisplay';


export function CreateTxMsgHandlePendingTransferModal({ nonceRanges, forcefulAccept, accept, badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        accept: boolean,
        forcefulAccept: boolean,
        nonceRanges: IdRange[],
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();

    const txCosmosMsg: MessageMsgHandlePendingTransfer = {
        creator: chain.cosmosAddress,
        accept,
        badgeId: badge.id,
        forcefulAccept,
        nonceRanges
    };

    return (
        <TxModal
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