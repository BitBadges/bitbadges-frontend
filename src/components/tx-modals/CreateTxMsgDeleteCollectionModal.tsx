import { notification } from 'antd';
import { MsgDeleteCollection, createTxMsgDeleteCollection } from 'bitbadgesjs-proto';
import { useRouter } from 'next/router';
import React from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { TxModal } from './TxModal';


export function CreateTxMsgDeleteCollectionModal({ collectionId, visible, setVisible, children }
  : {
    collectionId: bigint,
    visible: boolean
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
  }) {
  const chain = useChainContext();
  const router = useRouter();

  const txCosmosMsg: MsgDeleteCollection<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
  };

  const items = [
    {
      title: 'Delete Confirmation',
      description: <>
        <div className='flex-center flex-column'>
          <div>
            <b style={{ marginRight: 10, fontSize: 20 }}>IMPORTANT: Once you delete this collection, it will be gone forever.</b>
          </div>
          <br />
          <div>
            <p>If you are sure you want to delete this collection, please continue.</p>
          </div>
          <br />
        </div>
      </>,
    }
  ]

  return (
    <TxModal
      msgSteps={items}
      visible={visible}
      setVisible={setVisible}
      txName="Delete Collection"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgDeleteCollection}
      onSuccessfulTx={async () => {
        //Force refresh page
        notification.success({ message: 'Collection deleted successfully! Redirecting to home page...' });
        router.push('/');
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}