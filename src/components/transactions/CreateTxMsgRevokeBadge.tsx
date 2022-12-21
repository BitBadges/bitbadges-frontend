import React, { useState } from 'react';
import { Layout, Tooltip, Empty, List, Typography, Avatar, Drawer, Modal } from 'antd';
import { TransactionStatus } from '../../bitbadges-api/types';
import { useSelector } from 'react-redux';
import { useChainContext } from '../../chain_handlers_frontend/ChainContext';
import { formatAndCreateGenericTx } from '../../bitbadges-api/transactions';
import { broadcastTransaction } from '../../bitbadges-api/broadcast';
import { DEV_MODE } from '../../constants';
import Blockies from 'react-blockies';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';
import { createTxMsgNewBadge, createTxMsgRevokeBadge, createTxMsgTransferManager } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';

export function CreateTxMsgRevokeBadgeModal({ txCosmosMsg, visible, setVisible, children }
    : {
        txCosmosMsg: object,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Revoke Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRevokeBadge}
            displayMsg={"You are revoking manager to ___"}
        >
            {children}
        </TxModal>
    );
}
// content: (
//     <>
//         {revokeIsVisible && (
//             <div
//                 style={{
//                     width: '100%',
//                     display: 'flex',
//                     justifyContent: 'center',
//                 }}
//             >
//                 <Form
//                     layout="horizontal"
//                     style={{ width: '50vw' }}
//                 >
//                     <BurnOwnerFormItem
//                         owners={owners}
//                         setOwners={setOwners}
//                     />
//                     {getSignAndSubmitButton(async () => {
//                         const data = {
//                             owners,
//                             badgeId: badge.id,
//                         };
//                         submitTransaction(data, '/badges/burn');
//                     }, txnSubmitted || owners.length === 0)}
//                     <Divider />
//                 </Form>
//             </div>
//         )}
//     </>
// ),