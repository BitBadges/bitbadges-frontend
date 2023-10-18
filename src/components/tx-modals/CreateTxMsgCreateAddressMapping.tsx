import { notification } from 'antd';
import { MsgCreateAddressMappings, createTxMsgCreateAddressMappings } from 'bitbadgesjs-proto';
import { convertToCosmosAddress } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React from 'react';
import { addMetadataToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { MSG_PREVIEW_ID, MsgUpdateCollectionProps, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { TxModal } from './TxModal';

export function CreateTxMsgCreateAddressMappingModal(
  { visible, setVisible, children, inheritedTxState }
    : {
      visible: boolean,
      setVisible: (visible: boolean) => void,
      children?: React.ReactNode,
      inheritedTxState?: MsgUpdateCollectionProps
    }) {
  const chain = useChainContext();
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];

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
      uri = 'ipfs://Qmf8xxN2fwXGgouue3qsJtN8ZRSsnoHxM9mGcynTPhh6Ub';
    } else {
      let res = await addMetadataToIpfs({
        collectionMetadata: inheritedTxState.updateCollectionMetadataTimeline ? collection.cachedCollectionMetadata : undefined,
      });


      uri = 'ipfs://' + res.collectionMetadataResult?.cid;
    }

    const msgUpdateCollection: MsgCreateAddressMappings = {
      ...msg,
      creator: chain.cosmosAddress,
      addressMappings: [{
        ...msg.addressMappings[0],
        uri
      }]
    }

    console.log("FINAL MSG", msgUpdateCollection);

    return msgUpdateCollection;
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
