import React, { useState } from 'react';
import { Layout, Tooltip, Empty, List, Typography, Avatar, Drawer, Modal } from 'antd';
import { TransactionStatus } from '../../bitbadges-api/types';
import { useSelector } from 'react-redux';
import { useChainContext } from '../../chain/ChainContext';
import { formatAndCreateGenericTx } from '../../bitbadges-api/transactions';
import { broadcastTransaction } from '../../bitbadges-api/broadcast';
import { DEV_MODE } from '../../constants';
import Blockies from 'react-blockies';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';
import { createTxMsgNewBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';

export function CreateTxMsgNewBadgeModal({ txCosmosMsg, visible, setVisible, children }
    :
    {
        txCosmosMsg: object,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Create Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgNewBadge}
            displayMsg={"You are creating badge: "}
        >
            {children}
        </TxModal>
    );
}
