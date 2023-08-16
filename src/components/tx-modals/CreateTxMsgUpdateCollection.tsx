import { notification } from 'antd';
import { CollectionApprovedTransferTimeline, MsgUpdateCollection, createTxMsgUpdateCollection } from 'bitbadgesjs-proto';
import { BadgeMetadataDetails, DistributionMethod, MetadataAddMethod, OffChainBalancesMap, convertToCosmosAddress, createBalanceMapForOffChainBalances } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { addBalancesToIpfs, addMerkleChallengeToIpfs, addMetadataToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { FOREVER_DATE } from '../../utils/dates';
import { MSG_PREVIEW_ID, MsgUpdateCollectionProps, TxTimeline } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';

export function CreateTxMsgUpdateCollectionModal(
  { visible, setVisible, children, collectionId, doNotShowTimeline, inheritedTxState }
    : {
      visible: boolean,
      setVisible: (visible: boolean) => void,
      children?: React.ReactNode,
      collectionId?: bigint, //Note can be preview ID for new collection
      doNotShowTimeline?: boolean
      inheritedTxState?: MsgUpdateCollectionProps
    }) {
  const chain = useChainContext();
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  // const existingCollection = collectionId ? collections.collections[collectionId.toString()] : undefined;

  const [txState, setTxState] = useState<MsgUpdateCollectionProps | undefined>(inheritedTxState ?? undefined);

  // useEffect(() => {
  //   if (INFINITE_LOOP_MODE) console.log('useEffect:  update collection modal');
  //   setTxState(inheritedTxState ?? undefined)
  // }, [inheritedTxState]);

  const [disabled, setDisabled] = useState<boolean>(true);

  const msg: MsgUpdateCollection<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId ? collectionId : 0n,
    defaultApprovedIncomingTransfersTimeline: collection ? collection?.defaultUserApprovedIncomingTransfersTimeline : [],
    defaultApprovedOutgoingTransfersTimeline: collection ? collection?.defaultUserApprovedOutgoingTransfersTimeline : [],
    defaultUserPermissions: collection ? collection?.defaultUserPermissions : {
      canUpdateApprovedIncomingTransfers: [],
      canUpdateApprovedOutgoingTransfers: [],
    },
    badgesToCreate: txState ? txState?.badgesToCreate : [],
    updateCollectionPermissions: txState ? txState?.updateCollectionPermissions : false,
    balancesType: collection ? collection?.balancesType : "",
    collectionPermissions: collection ? collection?.collectionPermissions : {
      canArchiveCollection: [],
      canCreateMoreBadges: [],
      canDeleteCollection: [],
      canUpdateBadgeMetadata: [],
      canUpdateCollectionMetadata: [],
      canUpdateCollectionApprovedTransfers: [],
      canUpdateContractAddress: [],
      canUpdateCustomData: [],
      canUpdateInheritedBalances: [],
      canUpdateManager: [],
      canUpdateOffChainBalancesMetadata: [],
      canUpdateStandards: [],
    },
    updateManagerTimeline: txState ? txState?.updateManagerTimeline : false,
    managerTimeline: collection ? collection?.managerTimeline : [],
    updateCollectionMetadataTimeline: txState ? txState?.updateCollectionMetadataTimeline : false,
    collectionMetadataTimeline: collection ? collection?.collectionMetadataTimeline : [],
    updateBadgeMetadataTimeline: txState ? txState?.updateBadgeMetadataTimeline : false,
    badgeMetadataTimeline: collection ? collection?.badgeMetadataTimeline : [],
    updateOffChainBalancesMetadataTimeline: txState ? txState?.updateOffChainBalancesMetadataTimeline : false,
    offChainBalancesMetadataTimeline: collection ? collection?.offChainBalancesMetadataTimeline : [],
    updateCustomDataTimeline: txState ? txState?.updateCustomDataTimeline : false,
    customDataTimeline: collection ? collection?.customDataTimeline : [],
    updateInheritedBalancesTimeline: txState ? txState?.updateInheritedBalancesTimeline : false,
    inheritedBalancesTimeline: collection ? collection?.inheritedBalancesTimeline : [],
    updateCollectionApprovedTransfersTimeline: txState ? txState?.updateCollectionApprovedTransfersTimeline : false,
    collectionApprovedTransfersTimeline: collection ? collection?.collectionApprovedTransfersTimeline : [],
    updateStandardsTimeline: txState ? txState?.updateStandardsTimeline : false,
    standardsTimeline: collection ? collection?.standardsTimeline : [],
    updateContractAddressTimeline: txState ? txState?.updateContractAddressTimeline : false,
    contractAddressTimeline: collection ? collection?.contractAddressTimeline : [],
    updateIsArchivedTimeline: txState ? txState?.updateIsArchivedTimeline : false,
    isArchivedTimeline: collection ? collection?.isArchivedTimeline : [],
  }

  const msgSteps = []

  if (!doNotShowTimeline) {
    msgSteps.push(
      {
        title: collectionId == 0n ? 'Create Collection' : 'Update Collection',
        description: <TxTimeline isModal={true} txType={'UpdateCollection'} collectionId={collectionId} onFinish={(txState: MsgUpdateCollectionProps) => {
          setDisabled(false);
          setTxState(txState);
        }} />,
        disabled: disabled,
      }
    )
  }

  async function updateIPFSUris(simulate: boolean) {
    if (!txState || !collection) return;


    let offChainBalancesMetadataTimeline = collection.offChainBalancesMetadataTimeline;
    let collectionMetadataTimeline = collection.collectionMetadataTimeline;
    let badgeMetadataTimeline = collection.badgeMetadataTimeline;
    let prunedMetadata: BadgeMetadataDetails<bigint>[] = collection.cachedBadgeMetadata;

    //If metadata was added manually, we need to add it to IPFS and update the URIs in msg
    if (txState.addMethod == MetadataAddMethod.Manual && (txState.updateBadgeMetadataTimeline || txState.updateCollectionMetadataTimeline)) {
      if (simulate) {
        collectionMetadataTimeline = collectionMetadataTimeline.map(x => {
          return {
            ...x,
            collectionMetadata: {
              ...x.collectionMetadata,
              uri: 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB'
            }
          }
        });
        badgeMetadataTimeline = badgeMetadataTimeline.map(x => {
          return {
            ...x,
            badgeMetadata: x.badgeMetadata.map(y => {
              return {
                ...y,
                uri: 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB'
              }
            })
          }
        });
      } else {

        //TODO: Test this
        //TODO: Same with collection metadata and claims and balances
        prunedMetadata = prunedMetadata.filter(x => x.toUpdate);

        let res = await addMetadataToIpfs({
          collectionMetadata: txState.updateCollectionMetadataTimeline ? collection.cachedCollectionMetadata : undefined,
          badgeMetadata: txState.updateBadgeMetadataTimeline ? prunedMetadata : undefined,
        });
        // if (!res.collectionMetadataResult) throw new Error('Collection metadata not added to IPFS');

        if (txState.updateCollectionMetadataTimeline) {
          collectionMetadataTimeline = [{
            timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
            collectionMetadata: {
              uri: 'ipfs://' + res.collectionMetadataResult?.cid,
              customData: '',
            },
          }];
        }



        if (txState.updateBadgeMetadataTimeline) {
          badgeMetadataTimeline = [{
            timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
            badgeMetadata: []
          }]

          for (let i = 0; i < prunedMetadata.length; i++) {
            const metadata = prunedMetadata[i];
            const result = res.badgeMetadataResults[i];

            badgeMetadataTimeline[0].badgeMetadata.push({
              uri: 'ipfs://' + result.cid,
              badgeIds: metadata.badgeIds,
              customData: ''
            });

            metadata.uri = 'ipfs://' + result.cid;
          }
        }
      }
    }

    if (txState.addMethod == MetadataAddMethod.UploadUrl) {
      //If metadata was added via self-hosted URL, we do nothing bc there are no IPFS updates
    }

    //If distribution method is codes or a whitelist, we need to add the merkle tree to IPFS and update the claim URI
    if (txState.distributionMethod == DistributionMethod.Codes || txState.distributionMethod == DistributionMethod.Whitelist) {

      if (collection.collectionApprovedTransfersTimeline?.length > 0 && txState.updateCollectionApprovedTransfersTimeline) {
        if (simulate) {
          for (let i = 0; i < collection.collectionApprovedTransfersTimeline.length; i++) {
            for (let j = 0; j < collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers.length; j++) {
              for (let k = 0; k < collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails.length; k++) {
                for (let x = 0; x < collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges.length; x++) {
                  if (collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].uri) continue;
                  collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].uri = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';
                }
              }
            }
          }
        } else {
          for (let i = 0; i < collection.collectionApprovedTransfersTimeline.length; i++) {
            for (let j = 0; j < collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers.length; j++) {
              for (let k = 0; k < collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails.length; k++) {
                for (let x = 0; x < collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges.length; x++) {
                  if (collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].uri &&
                    collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].uri == 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB') {
                    collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].uri = '';
                  }

                  if (collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].uri) continue; //If it already has a URI, we don't need to add it to IPFS

                  if (collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details
                    && (collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details?.name
                      || collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details?.description
                      || collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details?.challengeDetails
                      || collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details?.password
                    )) {
                    let res = await addMerkleChallengeToIpfs({
                      name: collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details?.name || '',
                      description: collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details?.description || '',
                      challengeDetails: collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].details?.challengeDetails,
                    });

                    collection.collectionApprovedTransfersTimeline[i].collectionApprovedTransfers[j].approvalDetails[k].merkleChallenges[x].uri = 'ipfs://' + res.result.cid;
                  }
                }
              }
            }
          }
        }
      }
    }

    if (collection.balancesType == "Off-Chain" && txState.transfers.length > 0 && txState.updateOffChainBalancesMetadataTimeline
      && collection.offChainBalancesMetadataTimeline.length === 0

    ) {
      if (!simulate) {
        const _balanceMap = await createBalanceMapForOffChainBalances(txState.transfers);

        const balanceMap: OffChainBalancesMap<bigint> = {};
        for (const entries of Object.entries(_balanceMap)) {
          const [key, value] = entries;
          balanceMap[convertToCosmosAddress(key)] = value;
        }

        let res = await addBalancesToIpfs({ balances: balanceMap });
        offChainBalancesMetadataTimeline = [{
          timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
          offChainBalancesMetadata: {
            uri: 'ipfs://' + res.result.cid,
            customData: '',
          },
        }];
      } else {
        offChainBalancesMetadataTimeline = [{
          timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
          offChainBalancesMetadata: {
            uri: 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB',
            customData: '',
          },
        }];
      }
    }

    const collectionApprovedTransfersWithoutDetails: CollectionApprovedTransferTimeline<bigint>[] = collection.collectionApprovedTransfersTimeline?.map(x => {
      return {
        ...x,
        collectionApprovedTransfers: x.collectionApprovedTransfers.map(y => {
          return {
            ...y,
            approvalDetails: y.approvalDetails.map(z => {
              return {
                ...z,
                merkleChallenges: z.merkleChallenges.map(a => {
                  return {
                    ...a,
                    details: undefined,
                  }
                })
              }
            })
          }
        })
      }
    }) || [];


    const msgUpdateCollection: MsgUpdateCollection<bigint> = {
      ...msg,
      creator: chain.cosmosAddress,
      collectionId: collectionId ? collectionId : 0n,
      collectionApprovedTransfersTimeline: collectionApprovedTransfersWithoutDetails,
      badgesToCreate: txState ? txState.badgesToCreate : [],
      collectionMetadataTimeline: collectionMetadataTimeline,
      badgeMetadataTimeline: badgeMetadataTimeline,
      offChainBalancesMetadataTimeline: offChainBalancesMetadataTimeline,
    }

    console.log("FINAL MSG", msgUpdateCollection);

    return msgUpdateCollection;
  }

  return (
    <TxModal
      visible={visible}
      setVisible={setVisible}
      txName="Updated Collection"
      txCosmosMsg={msg}
      createTxFunction={createTxMsgUpdateCollection}
      beforeTx={async (simulate: boolean) => {
        const newMsg = await updateIPFSUris(simulate);
        return newMsg
      }}
      msgSteps={msgSteps}


      onSuccessfulTx={async () => {

        notification.success({ message: 'Collection created / updated successfully! Note it may take some time for some of the details to populate.' });

        if (collectionId && collectionId > 0n) {
          await collections.fetchCollections([collectionId], true);
          router.push(`/collections/${collectionId}`);
        } else {
          //navigating to a new collection page is handled in TxModal
        }
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}
