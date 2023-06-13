import { Modal } from 'antd';
import { MsgMintAndDistributeBadges, createTxMsgMintAndDistributeBadges } from 'bitbadgesjs-transactions';
import { BadgeMetadataDetails, DistributionMethod, MetadataAddMethod, removeBadgeMetadata, createBalanceMapForOffChainBalances } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { addBalancesToIpfs, addClaimToIpfs, addMetadataToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID, MsgMintAndDistriubteBadgesProps, TxTimeline } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';

export function CreateTxMsgMintAndDistributeBadgesModal(
  { visible, setVisible, children, txType, collectionId }
    : {
      visible: boolean,
      setVisible: (visible: boolean) => void,
      children?: React.ReactNode,
      txType: 'AddBadges' | 'DistributeBadges'
      collectionId: bigint,
    }
) {
  const chain = useChainContext();
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);
  const existingCollection = collectionId ? collections.getCollection(collectionId) : undefined;

  const [txState, setTxState] = useState<MsgMintAndDistriubteBadgesProps>();

  const newMintMsg: MsgMintAndDistributeBadges<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    claims: txState ? txState?.claims : [],
    transfers: txState ? txState?.transfers : [],
    badgeSupplys: txState ? txState?.badgeSupplys : [],
    collectionUri: collection && txType === 'AddBadges' ? collection?.collectionUri : "",
    badgeUris: collection && txType === 'AddBadges' ? collection?.badgeUris : [],
    balancesUri: collection ? collection?.balancesUri : "",
  }

  async function updateIPFSUris() {
    if (!txState || !collection || !existingCollection) return;

    let balancesUri = collection.balancesUri;
    let collectionUri = collection.collectionUri;
    let badgeUris = collection.badgeUris;
    let claims = txState.claims;
    let prunedMetadata: BadgeMetadataDetails<bigint>[] = collection.badgeMetadata;

    //If metadata was added manually, we need to add it to IPFS and update the URIs in msg
    if (txState.addMethod == MetadataAddMethod.Manual && txType === 'AddBadges') {

      //Prune the metadata to only include the new metadata (i.e. no metadata from existingCollection)

      prunedMetadata = removeBadgeMetadata(prunedMetadata, [{ start: existingCollection.nextBadgeId, end: collection.nextBadgeId - 1n }]);

      let res = await addMetadataToIpfs({
        collectionMetadata: collection.collectionMetadata,
        badgeMetadata: prunedMetadata
      });
      for (const metadata of prunedMetadata) {
        metadata.uri = 'ipfs://' + res.badgeMetadataResults.shift()?.cid + '/' + res.badgeMetadataResults.shift()?.path;
      }
    } else if (txState.addMethod == MetadataAddMethod.UploadUrl && txType === 'AddBadges') {
      //If metadata was added via self-hosted URL, we simply just append the msg URIs to the existingCollection URIs
    }

    //If distribution method is codes or a whitelist, we need to add the merkle tree to IPFS and update the claim URI
    if (txState.distributionMethod == DistributionMethod.Codes || txState.distributionMethod == DistributionMethod.Whitelist) {
      if (txState.claims?.length > 0) {
        for (let i = 0; i < txState.claims.length; i++) {
          let merkleTreeRes = await addClaimToIpfs({
            name: claims[i].details?.name || '',
            description: claims[i].details?.description || '',
            challengeDetails: claims[i].details?.challengeDetails || [],
            password: claims[i].password,
          });

          claims[i].uri = 'ipfs://' + merkleTreeRes.result.cid + '/' + merkleTreeRes.result.path;
        }
      }
    }

    if (txState.distributionMethod === DistributionMethod.OffChainBalances) {
      const balanceMap = await createBalanceMapForOffChainBalances(txState.transfers);

      let res = await addBalancesToIpfs({ balances: balanceMap });
      balancesUri = 'ipfs://' + res.result.cid + '/' + res.result.path;
    }


    return {
      creator: chain.cosmosAddress,
      collectionId: collectionId,
      claims: claims,
      transfers: txState && txState.distributionMethod !== DistributionMethod.OffChainBalances ? txState.transfers : [],
      badgeSupplys: txState ? txState.badgeSupplys : [],
      collectionUri: collectionUri,
      badgeUris: badgeUris,
      balancesUri: balancesUri,
    } as MsgMintAndDistributeBadges<bigint>;
  }

  const [disabled, setDisabled] = useState<boolean>(true);

  const msgSteps = [
    {
      title: txType === 'AddBadges' ? 'Add Badges' : 'Distribute Badges',
      description: <TxTimeline txType={txType} collectionId={collectionId} onFinish={(txState: MsgMintAndDistriubteBadgesProps) => {
        setDisabled(false);
        setTxState(txState);
      }} />,
      disabled: disabled,
    }
  ];

  return (
    <TxModal
      beforeTx={async () => {
        const newMintMsg = await updateIPFSUris();
        return newMintMsg
      }}
      msgSteps={msgSteps}
      visible={visible}
      setVisible={setVisible}
      txName="Mint Badges"
      txCosmosMsg={newMintMsg}
      createTxFunction={createTxMsgMintAndDistributeBadges}
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
