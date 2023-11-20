import { notification } from 'antd';
import { MsgCreateAddressMappings, createTxMsgCreateAddressMappings } from 'bitbadgesjs-proto';
import { convertToCosmosAddress } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React from 'react';
import { addMetadataToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { NEW_COLLECTION_ID, MsgUniversalUpdateCollectionProps, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { TxModal } from './TxModal';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';

export function CreateTxMsgCreateAddressMappingModal(
  { visible, setVisible, children, inheritedTxState }
    : {
      visible: boolean,
      setVisible: (visible: boolean) => void,
      children?: React.ReactNode,
      inheritedTxState?: MsgUniversalUpdateCollectionProps
    }) {
  const chain = useChainContext();
  const router = useRouter();

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();

  const msg: MsgCreateAddressMappings = {
    creator: chain.cosmosAddress,
    addressMappings: inheritedTxState?.addressMapping ? [{
      ...inheritedTxState.addressMapping,
      addresses: inheritedTxState.addressMapping.addresses.map(x => convertToCosmosAddress(x))
    }] : []
  }

  async function updateIPFSUris(simulate: boolean) {
    if (!inheritedTxState || !collection) return;

    let uri = '';
    //If metadata was added manually, we need to add it to IPFS and update the URIs in msg
    if (simulate) {
      uri = 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs';
    } else {
      let res = await addMetadataToIpfs({
        collectionMetadata: inheritedTxState.updateCollectionMetadataTimeline ? collection.cachedCollectionMetadata : undefined,
      });

      uri = 'ipfs://' + res.collectionMetadataResult?.cid;
    }

    const MsgUniversalUpdateCollection: MsgCreateAddressMappings = {
      ...msg,
      creator: chain.cosmosAddress,
      addressMappings: [{
        ...msg.addressMappings[0],
        createdBy: undefined,
        uri
      }]
    }

    console.log("FINAL MSG", MsgUniversalUpdateCollection);

    return MsgUniversalUpdateCollection;
  }

  const msgSteps: any[] = [];

  return (
    <TxModal
      visible={visible}
      setVisible={setVisible}
      txName="Address List"
      txCosmosMsg={msg}
      createTxFunction={createTxMsgCreateAddressMappings}
      msgSteps={msgSteps}
      beforeTx={async (simulate: boolean) => {
        const newMsg = await updateIPFSUris(simulate);
        return newMsg
      }}

      onSuccessfulTx={async () => {
        notification.success({ message: 'Created successfully!' });
        router.push(`/addresses/${inheritedTxState?.addressMapping.mappingId}`);

        txTimelineContext.resetState();
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}
