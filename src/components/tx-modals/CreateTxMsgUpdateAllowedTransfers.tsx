import { Modal } from 'antd';
import { MsgUpdateAllowedTransfers, createTxMsgUpdateAllowedTransfers } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID, MsgUpdateAllowedProps, TxTimeline } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdateAllowedTransfersModal({ visible, setVisible, children, collectionId }
  : {
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode
    collectionId: bigint,
  }) {
  const router = useRouter();
  const collections = useCollectionsContext();
  const chain = useChainContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  const [disabled, setDisabled] = useState<boolean>(true);

  const updateAllowedTransfersMsg: MsgUpdateAllowedTransfers<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    allowedTransfers: collection ? collection.allowedTransfers : []
  };

  const msgSteps = [
    {
      title: 'Edit Transferability',
      description: <TxTimeline
        txType='UpdateAllowed'
        collectionId={collectionId}
        onFinish={(_txState: MsgUpdateAllowedProps) => {
          setDisabled(false);
        }}
      />,
      disabled: disabled,
    }
  ];

  return (
    <TxModal
      msgSteps={msgSteps}
      visible={visible}
      setVisible={setVisible}
      txName="Edit Transferability"
      txCosmosMsg={updateAllowedTransfersMsg}
      createTxFunction={createTxMsgUpdateAllowedTransfers}
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
        router.push(`/collections/${collectionId}`)
        Modal.destroyAll()
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}