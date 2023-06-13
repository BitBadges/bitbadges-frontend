import { Modal } from 'antd';
import { MsgUpdateUris, createTxMsgUpdateBytes } from 'bitbadgesjs-transactions';
import { DistributionMethod, createBalanceMapForOffChainBalances } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { addBalancesToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID, MsgUpdateBalancesProps, TxTimeline } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdateBalancesModal({ visible, setVisible, children, collectionId }
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

  const [txState, setTxState] = useState<MsgUpdateBalancesProps>();
  const [disabled, setDisabled] = useState<boolean>(true);

  const msg: MsgUpdateUris<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    collectionUri: collection ? collection.collectionUri : "",
    badgeUris: collection ? collection.badgeUris : [],
    balancesUri: collection ? collection.balancesUri : "",
  };

  async function updateIPFSUris() {
    if (!txState || !collection) return;



    const isOffChainBalances = txState.distributionMethod === DistributionMethod.OffChainBalances;
    let balancesUri = collection.balancesUri;
    if (isOffChainBalances) {
      const balanceMap = await createBalanceMapForOffChainBalances(txState.transfers);

      let res = await addBalancesToIpfs({ balances: balanceMap });
      balancesUri = 'ipfs://' + res.result.cid + '/' + res.result.path;
    }

    return {
      creator: chain.cosmosAddress,
      collectionId: collectionId,
      collectionUri: collection ? collection.collectionUri : "",
      badgeUris: collection ? collection.badgeUris : [],
      balancesUri: balancesUri,
    } as MsgUpdateUris<bigint>;
  }

  const msgSteps = [
    {
      title: 'Update Balances',
      description: <TxTimeline
        txType='UpdateBalances'
        collectionId={collectionId}
        onFinish={(txState: MsgUpdateBalancesProps) => {
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
        const newMsg = await updateIPFSUris();
        return newMsg
      }}
      msgSteps={msgSteps}
      visible={visible}
      setVisible={setVisible}
      txName="Update Balances"
      txCosmosMsg={msg}
      createTxFunction={createTxMsgUpdateBytes}
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