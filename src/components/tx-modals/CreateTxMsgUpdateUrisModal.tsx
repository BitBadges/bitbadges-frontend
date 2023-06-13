import { MsgUpdateUris, createTxMsgUpdateUris } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { addMetadataToIpfs } from '../../bitbadges-api/api';
import { MetadataAddMethod } from 'bitbadgesjs-utils';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { TxModal } from './TxModal';
import { TxTimeline, MsgUpdateUrisProps, MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';
import { Modal } from 'antd';


export function CreateTxMsgUpdateUrisModal({ visible, setVisible, children, collectionId
}: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const router = useRouter();
  const collections = useCollectionsContext();
  const chain = useChainContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  const [txState, setTxState] = useState<MsgUpdateUrisProps>();

  async function updateIPFSUris() {
    if (!txState || !collection) return;

    //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
    if (txState.addMethod == MetadataAddMethod.Manual) {
      let res = await addMetadataToIpfs({ collectionMetadata: collection.collectionMetadata, badgeMetadata: collection.badgeMetadata });

      let badgeUris = [];
      for (let i = 0; i < collection.badgeMetadata.length; i++) {
        badgeUris.push({
          uri: 'ipfs://' + res.badgeMetadataResults[i].cid + '/' + res.badgeMetadataResults[i].path,
          badgeIds: collection.badgeMetadata[i].badgeIds
        });
      }

      return {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        collectionUri: 'ipfs://' + res.collectionMetadataResult?.cid + '/' + res.collectionMetadataResult?.path,
        badgeUris: badgeUris
      } as MsgUpdateUris<bigint>;
    }

    //If metadata is self-hosted from a URL, we currently assume that they are updating all metadata, and txState.msg is already set
  }

  const updateUrisMsg: MsgUpdateUris<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    collectionUri: collection ? collection?.collectionUri : '',
    badgeUris: collection ? collection?.badgeUris : [],
    balancesUri: collection ? collection?.balancesUri : '',
  }

  const [disabled, setDisabled] = useState<boolean>(true);

  const msgSteps = [
    {
      title: 'Update Metadata',
      description: <TxTimeline txType='UpdateMetadata'
        collectionId={collectionId}
        onFinish={(txState: MsgUpdateUrisProps) => {
          setDisabled(false);
          setTxState(txState);
        }}
      />,
      disabled: disabled,
    }
  ];


  return (
    <TxModal
      beforeTx={async () => {
        const newUpdateUrisMsg = await updateIPFSUris();
        return newUpdateUrisMsg;
      }}
      msgSteps={msgSteps}
      visible={visible}
      setVisible={setVisible}
      txName="Update Metadata"
      txCosmosMsg={updateUrisMsg}
      createTxFunction={createTxMsgUpdateUris}
      onSuccessfulTx={async () => {
        await collections.triggerMetadataRefresh(collectionId);
        router.push(`/collections/${collectionId}`)
        Modal.destroyAll()
      }}
      requireRegistration
    >
      {children}
    </TxModal >
  );
}