import { Button } from 'antd';
import { BadgeSupplyAndAmount } from 'bitbadgesjs-proto';
import { MsgNewCollection } from 'bitbadgesjs-transactions';
import { ClaimInfoWithDetails, DistributionMethod, GetPermissionNumberValue, MetadataAddMethod, TransferWithIncrements, createBalanceMapForOffChainBalances } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { addBalancesToIpfs, addClaimToIpfs, addMetadataToIpfs } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { CreateTxMsgNewCollectionModal } from '../../tx-modals/CreateTxMsgNewCollectionModal';
import { MSG_PREVIEW_ID } from '../TxTimeline';

export function SubmitMsgNewCollection({
  addMethod,
  claims,
  transfers,
  badgeSupplys,
  distributionMethod,
}: {
  addMethod: MetadataAddMethod;
  claims: (ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[];
  transfers: TransferWithIncrements<bigint>[];
  badgeSupplys: BadgeSupplyAndAmount<bigint>[];
  distributionMethod: DistributionMethod;
}) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);
  const collectionMetadata = collection?.collectionMetadata;
  const badgeMetadata = collection?.badgeMetadata || [];

  const [visible, setVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const [collectionUri, setCollectionUri] = useState(collection?.collectionUri);
  const [badgeUri, setBadgeUri] = useState(collection?.badgeUris);
  const [balancesUri, setBalancesUri] = useState(collection?.balancesUri);
  const [isOffChainBalances, setIsOffChainBalances] = useState<boolean>(false);

  async function updateIPFSUris() {
    //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
    let collectionUri = collection?.collectionUri;
    let badgeUris = collection?.badgeUris || [];
    let balancesUri = collection?.balancesUri;

    if (addMethod == MetadataAddMethod.Manual) {
      let res = await addMetadataToIpfs({ collectionMetadata, badgeMetadata });
      if (!res.collectionMetadataResult) throw new Error('Collection metadata not added to IPFS');

      collectionUri = 'ipfs://' + res.collectionMetadataResult?.cid + '/' + res.collectionMetadataResult?.path
      badgeUris = [];


      for (let i = 0; i < res.badgeMetadataResults.length; i++) {
        const badgeRes = res.badgeMetadataResults[i];
        badgeUris.push({
          uri: 'ipfs://' + badgeRes.cid + '/' + badgeRes.path,
          badgeIds: badgeMetadata[i].badgeIds
        });
      }

      //No need to append here or perform any additional logic with the badge URIs like in MintBadge because there is no existing metadata
    }

    //If distribution method is codes or a whitelist, add the merkle tree to IPFS and update the claim URI
    if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.Whitelist) {
      if (claims?.length > 0) {
        for (let i = 0; i < claims.length; i++) {
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

    if (distributionMethod === DistributionMethod.OffChainBalances) {
      const balanceMap = await createBalanceMapForOffChainBalances(transfers);

      let res = await addBalancesToIpfs({ balances: balanceMap });
      balancesUri = 'ipfs://' + res.result.cid + '/' + res.result.path;
    }

    setIsOffChainBalances(distributionMethod === DistributionMethod.OffChainBalances);
    setBalancesUri(balancesUri);
    setCollectionUri(collectionUri);
    setBadgeUri(badgeUris);
  }


  const msg: MsgNewCollection<bigint> = {
    creator: chain.cosmosAddress,
    collectionUri: collectionUri || '',
    badgeUris: badgeUri || [],
    balancesUri: balancesUri || '',
    badgeSupplys: badgeSupplys,
    permissions: collection ? GetPermissionNumberValue(collection?.permissions) : 0n,
    bytes: collection?.bytes || '',
    managerApprovedTransfers: collection?.managerApprovedTransfers || [],
    allowedTransfers: collection?.allowedTransfers || [],
    standard: collection?.standard || 0n,
    transfers: isOffChainBalances ? [] : transfers,
    claims: isOffChainBalances ? [] : claims.map(claim => ({
      ...claim,
      codes: undefined,
      password: undefined,
      details: undefined,
    })),
  }

  return <div className='full-width flex-center'
    style={{ marginTop: 20, }} >
    <Button
      type="primary"
      style={{ width: '90%' }}
      loading={loading}
      onClick={() => setVisible(true)}
    >
      Create Badge Collection!
    </Button>
    <CreateTxMsgNewCollectionModal
      visible={visible}
      setVisible={setVisible}
      txCosmosMsg={msg}
      beforeTx={async () => {
        setLoading(true);
        await updateIPFSUris();
        setVisible(true);
        setLoading(false);
      }}
    />
  </div >
}
