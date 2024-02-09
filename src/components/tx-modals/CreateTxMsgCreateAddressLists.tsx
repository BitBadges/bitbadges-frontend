import { notification } from 'antd';
import { MsgCreateAddressLists } from 'bitbadgesjs-sdk';
import { convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo } from 'react';
import { addMetadataToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { MsgUniversalUpdateCollectionProps, NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { TxModal } from './TxModal';

export function CreateTxMsgCreateAddressListModal(
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

  const updateIPFSUris = useCallback(async (simulate: boolean) => {

    if (!inheritedTxState || !collection) return;
    const msg: MsgCreateAddressLists = {
      creator: chain.cosmosAddress,
      addressLists: inheritedTxState?.addressList ? [{
        ...inheritedTxState.addressList,
        addresses: inheritedTxState.addressList.addresses.map(x => convertToCosmosAddress(x))
      }] : []
    }
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

    const MsgUniversalUpdateCollection: MsgCreateAddressLists = {
      ...msg,
      creator: chain.cosmosAddress,
      addressLists: [{
        ...msg.addressLists[0],
        createdBy: undefined,
        uri
      }]
    }

    console.log("FINAL MSG", MsgUniversalUpdateCollection);

    return MsgUniversalUpdateCollection;
  }, [inheritedTxState, collection, chain.cosmosAddress]);

  const msgSteps: any[] = [];

  const txsInfo = useMemo(() => {
    const msg = {
      creator: chain.cosmosAddress,
      addressLists: inheritedTxState?.addressList ? [{
        ...inheritedTxState.addressList,
        addresses: inheritedTxState.addressList.addresses.map(x => convertToCosmosAddress(x))
      }] : []
    }

    return [
      {
        type: 'MsgCreateAddressLists',
        msg: msg,
        beforeTx: async (simulate: boolean) => {
          const newMsg = await updateIPFSUris(simulate);
          return newMsg;
        },
        afterTx: async () => {
          notification.success({ message: 'Created successfully!' });
          await router.push(`/lists/${inheritedTxState?.addressList.listId}`);
        }
      }
    ]
  }, [inheritedTxState?.addressList, chain.cosmosAddress, router, updateIPFSUris]);

  return (
    <TxModal
      visible={visible}
      setVisible={setVisible}
      txsInfo={txsInfo}
      txName="Address List"
      msgSteps={msgSteps}
      requireLogin
    >
      {children}
    </TxModal>
  );
}
