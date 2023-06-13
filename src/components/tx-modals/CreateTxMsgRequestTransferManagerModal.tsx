import { MsgRequestTransferManager, createTxMsgRequestTransferManager } from 'bitbadgesjs-transactions';
import React from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { TxModal } from './TxModal';

export function CreateTxMsgRequestTransferManagerModal({ collectionId, visible, setVisible, children }
  : {
    collectionId: bigint,
    visible: boolean
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
  }) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  const txCosmosMsg: MsgRequestTransferManager<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    addRequest: collection?.managerRequests.find((request) => request === chain.cosmosAddress) === undefined,
  };

  const items = [
    {
      title: 'Add / Remove Request',
      description: <>
        <div className='flex-center flex-column'>
          <div>
            <b style={{ marginRight: 10, fontSize: 20 }}> {collection?.managerRequests.find((request) => request === chain.cosmosAddress) ? 'You have already requested to be the manager for this collection.' : 'You have not requested to be the manager for this collection yet.'}</b>
          </div>
          <div>
            <p>{collection?.managerRequests.find((request) => request === chain.cosmosAddress) ? `This transaction will cancel your request to become the manager of this collection (ID: ${collectionId}).` : `This transaction will be a request to become the manager of this collection (ID: ${collectionId}).`}</p>
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
      txName="Request Transfer Manager"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgRequestTransferManager}
      onSuccessfulTx={async () => { await collections.fetchCollections([collectionId], true) }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}