import { InfoCircleOutlined } from '@ant-design/icons';
import { MsgTransferManager, createTxMsgTransferManager } from 'bitbadgesjs-transactions';
import { isAddressValid } from 'bitbadgesjs-utils';
import React, { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { AddressSelect } from '../address/AddressSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgTransferManagerModal({ collectionId, visible, setVisible, children }
  : {
    collectionId: bigint,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
  }
) {
  const chain = useChainContext();
  const collections = useCollectionsContext();

  const [newManager, setNewManager] = useState<string>(chain.cosmosAddress);

  const txCosmosMsg: MsgTransferManager<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    address: chain.cosmosAddress,
  };

  const items = [
    {
      title: 'Select Address',
      description: <>
        <AddressSelect defaultValue={newManager} onUserSelect={setNewManager} />
        <br />
        <InfoCircleOutlined /> The new manager must have already submitted a transfer manager request.
      </>,
      disabled: !newManager || !isAddressValid(newManager),
    }
  ]

  return (
    <TxModal
      msgSteps={items}
      visible={visible}
      setVisible={setVisible}
      txName="Transfer Manager"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgTransferManager}
      onSuccessfulTx={async () => { await collections.fetchCollections([collectionId], true); }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}
