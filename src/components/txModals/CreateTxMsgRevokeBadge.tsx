import React from 'react';
import { createTxMsgRevokeBadge } from 'bitbadgesjs-transactions';
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