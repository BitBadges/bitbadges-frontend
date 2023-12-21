import { notification } from 'antd';
import { MsgDeleteCollection } from 'bitbadgesjs-proto';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
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

  const txsInfo = useMemo(() => {
    const txCosmosMsg: MsgDeleteCollection<bigint> = {
      creator: chain.cosmosAddress,
      collectionId: collectionId,
    };

    return [
      {
        type: 'MsgDeleteCollection',
        msg: txCosmosMsg,
        afterTx: async () => {
          notification.success({ message: 'Collection deleted successfully! Redirecting to home page...' });
          router.push('/');
        }
      }
    ]
  }, [chain.cosmosAddress, collectionId, router]);

  return (
    <TxModal
    msgSteps={items}
    visible={visible}
    setVisible={setVisible}
    txsInfo={txsInfo}
    txName="Delete Collection"
    requireRegistration
  >
    {children}
  </TxModal>

  );
}