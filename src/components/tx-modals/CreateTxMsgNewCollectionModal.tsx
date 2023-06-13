import { MsgNewCollection, createTxMsgNewCollection } from 'bitbadgesjs-transactions';
import React from 'react';
import { TxModal } from './TxModal';
import { message } from 'antd';

export function CreateTxMsgNewCollectionModal(
  { txCosmosMsg, visible, setVisible, children, beforeTx }
    : {
      txCosmosMsg: MsgNewCollection<bigint>,
      visible: boolean,
      setVisible: (visible: boolean) => void,
      children?: React.ReactNode,
      beforeTx?: () => Promise<void>
    }) {
  return (
    <TxModal
      visible={visible}
      setVisible={setVisible}
      txName="Create Collection"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgNewCollection}
      beforeTx={beforeTx}
      onSuccessfulTx={async () => {
        //navigating to the new collection page is handled in TxModal
        message.success('Collection created successfully! Note it may take time for the metadata to update.');
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}
