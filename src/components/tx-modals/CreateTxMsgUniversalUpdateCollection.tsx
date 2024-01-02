import { BadgeMetadataTimeline, CollectionApproval, MsgUniversalUpdateCollection } from 'bitbadgesjs-proto';
import { BadgeMetadataDetails, DefaultPlaceholderMetadata, MetadataAddMethod, TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission, convertToCosmosAddress, getFirstMatchForBadgeMetadata, getTransfersFromTransfersWithIncrements } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { addApprovalDetailsToOffChainStorage, addMetadataToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';

import { notification } from 'antd';
import { fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { neverHasManager } from '../../bitbadges-api/utils/manager';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { getPermissionDetails } from '../collection-page/PermissionsInfo';
import { isCompletelyForbidden } from '../tx-timelines/step-items/CanUpdateOffChainBalancesStepItem';
import { TxInfo, TxModal } from './TxModal';
import { createBalancesMapAndAddToStorage } from './UpdateBalancesModal';



export function CreateTxMsgUniversalUpdateCollectionModal(
  { visible, setVisible, children,
    MsgUniversalUpdateCollection, afterTxParam,
    isBitBadgesFollowProtocol,
    isExperiencesProtocol

  }
    : {
      visible: boolean,
      setVisible: (visible: boolean) => void,
      children?: React.ReactNode,
      MsgUniversalUpdateCollection?: MsgUniversalUpdateCollection<bigint>,
      afterTxParam?: (collectionId: bigint) => Promise<void>
      isBitBadgesFollowProtocol?: boolean,
      isExperiencesProtocol?: boolean,
    }) {
  const chain = useChainContext();
  const router = useRouter();

  const txTimelineContext = useTxTimelineContext();
  const collectionId = txTimelineContext.existingCollectionId ?? NEW_COLLECTION_ID;
  const collection = useCollection(NEW_COLLECTION_ID);
  const txsInfo = useMemo(() => {
  const msg: MsgUniversalUpdateCollection<bigint> = MsgUniversalUpdateCollection ?? {
    creator: chain.cosmosAddress,
    collectionId: collectionId ? collectionId : 0n,
    defaultBalances: collection ? collection?.defaultBalances : {
      balances: [],
      incomingApprovals: [],
      outgoingApprovals: [],
      userPermissions: {
        canUpdateIncomingApprovals: [],
        canUpdateOutgoingApprovals: [],
        canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
        canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      },
      autoApproveSelfInitiatedIncomingTransfers:  true,
      autoApproveSelfInitiatedOutgoingTransfers:  true,
    },
    
    badgesToCreate: txTimelineContext.badgesToCreate,
    updateCollectionPermissions: txTimelineContext.updateCollectionPermissions,
    balancesType: collection ? collection?.balancesType : "",
    collectionPermissions: collection ? collection?.collectionPermissions : {
      canArchiveCollection: [],
      canCreateMoreBadges: [],
      canDeleteCollection: [],
      canUpdateBadgeMetadata: [],
      canUpdateCollectionMetadata: [],
      canUpdateCollectionApprovals: [],
      canUpdateCustomData: [],
      canUpdateManager: [],
      canUpdateOffChainBalancesMetadata: [],
      canUpdateStandards: [],
    },
    updateManagerTimeline: txTimelineContext.updateManagerTimeline,
    managerTimeline: collection ? collection?.managerTimeline : [],
    updateCollectionMetadataTimeline: txTimelineContext.updateCollectionMetadataTimeline,
    collectionMetadataTimeline: collection ? collection?.collectionMetadataTimeline : [],
    updateBadgeMetadataTimeline: txTimelineContext.updateBadgeMetadataTimeline,
    badgeMetadataTimeline: collection ? collection?.badgeMetadataTimeline : [],
    updateOffChainBalancesMetadataTimeline: txTimelineContext.updateOffChainBalancesMetadataTimeline,
    offChainBalancesMetadataTimeline: collection ? collection?.offChainBalancesMetadataTimeline : [],
    updateCustomDataTimeline: txTimelineContext.updateCustomDataTimeline,
    customDataTimeline: collection ? collection?.customDataTimeline : [],
    updateCollectionApprovals: txTimelineContext.updateCollectionApprovals,
    collectionApprovals: collection ? collection?.collectionApprovals : [],
    updateStandardsTimeline: txTimelineContext.updateStandardsTimeline,
    standardsTimeline: collection ? collection?.standardsTimeline : [],
    updateIsArchivedTimeline: txTimelineContext.updateIsArchivedTimeline,
    isArchivedTimeline: collection ? collection?.isArchivedTimeline : [],
  }

  //This function basically takes all relevant details from collection / txTimelineContext that need to be added to IPFS and adds them
  //It then returns a new final msg with the updated URIs to be broadcasted on-chain
  //If simulate is true, it will return a msg with dummy URIs
  //Eventually, we should probably parallelize this
  async function getFinalMsgWithStoredUris(simulate: boolean) {
    if (!txTimelineContext || !collection) return;

    let offChainBalancesMetadataTimeline = collection.offChainBalancesMetadataTimeline;
    let collectionMetadataTimeline = collection.collectionMetadataTimeline;
    let badgeMetadataTimeline = collection.badgeMetadataTimeline;
    let prunedMetadata: BadgeMetadataDetails<bigint>[] = collection.cachedBadgeMetadata.filter(x => x.badgeIds.length > 0 && x.toUpdate && !compareObjects(DefaultPlaceholderMetadata, x.metadata));

    //If metadata was added manually, we need to add it to IPFS and update the URIs in msg
    //If metadata was added with a URI, the timeline should already be updated with the final URI
    if ((txTimelineContext.updateBadgeMetadataTimeline || txTimelineContext.updateCollectionMetadataTimeline)) {
      if (simulate) {
        if (txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual && txTimelineContext.updateCollectionMetadataTimeline) {
          collectionMetadataTimeline = collectionMetadataTimeline.map(x => {
            return {
              ...x,
              collectionMetadata: {
                ...x.collectionMetadata,
                uri: 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs'
              }
            }
          });
        }
        if (txTimelineContext.badgeAddMethod === MetadataAddMethod.Manual && txTimelineContext.updateBadgeMetadataTimeline) {
          badgeMetadataTimeline = badgeMetadataTimeline.map(x => {
            return {
              ...x,
              badgeMetadata: x.badgeMetadata.map(y => {
                return {
                  ...y,
                  uri: y.uri ?? 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs'
                }
              })
            }
          });
        }
      } else {
        const body = {
          collectionMetadata: txTimelineContext.updateCollectionMetadataTimeline && txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual
            ? collection.cachedCollectionMetadata : undefined,
          badgeMetadata: txTimelineContext.updateBadgeMetadataTimeline && txTimelineContext.badgeAddMethod === MetadataAddMethod.Manual
            ? prunedMetadata : undefined,
        }

        const toUpload = body.collectionMetadata || body.badgeMetadata;
        if (toUpload) {
          notification.info({
            message: 'Uploading metadata',
            description: 'Give us a second to handle the uploading of your collection\'s metadata to IPFS.',
          })

          let res = await addMetadataToIpfs(body);
          // if (!res.collectionMetadataResult) throw new Error('Collection metadata not added to IPFS');

          if (txTimelineContext.updateCollectionMetadataTimeline && txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual) {
            collectionMetadataTimeline = [{
              timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              collectionMetadata: {
                uri: 'ipfs://' + res.collectionMetadataResult?.cid,
                customData: '',
              },
            }];
          }

          if (txTimelineContext.updateBadgeMetadataTimeline && txTimelineContext.badgeAddMethod === MetadataAddMethod.Manual) {
            let newBadgeMetadataTimeline: BadgeMetadataTimeline<bigint>[] = [{
              timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              badgeMetadata: []
            }]

            //First, we add the new metadata that should be updated
            for (let i = 0; i < prunedMetadata.length; i++) {
              const metadata = prunedMetadata[i];
              const result = res.badgeMetadataResults[i];

              newBadgeMetadataTimeline[0].badgeMetadata.push({
                uri: 'ipfs://' + result.cid,
                badgeIds: metadata.badgeIds,
                customData: ''
              });

              metadata.uri = 'ipfs://' + result.cid;
            }

            //Next, we add any existing metadata that wasn't updated
            if (collection.badgeMetadataTimeline.length > 0 && collection.badgeMetadataTimeline[0].badgeMetadata.length > 0) {
              newBadgeMetadataTimeline[0].badgeMetadata.push(...collection.badgeMetadataTimeline[0].badgeMetadata);
            }

            //Add default placeholder metadata for any badges that don't have metadata (IDs > max)
            //Permissions should be set to allow updating this metadata
            newBadgeMetadataTimeline[0].badgeMetadata.push({
              uri: 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs',
              badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
              customData: ''
            });

            //Get first match only. Thus, we prioritize updates -> existing -> not handled in that order
            newBadgeMetadataTimeline[0].badgeMetadata = getFirstMatchForBadgeMetadata(newBadgeMetadataTimeline[0].badgeMetadata).filter(x => x.badgeIds.length > 0);

            badgeMetadataTimeline = newBadgeMetadataTimeline;
          }
        }
      }
    }



    //If distribution method is codes or a whitelist, we need to add the merkle tree to IPFS and update the claim URI
    if (collection.collectionApprovals?.length > 0 && txTimelineContext.updateCollectionApprovals) {
      if (simulate) {
        for (let i = 0; i < collection.collectionApprovals.length; i++) {
          const approval = collection.collectionApprovals[i];
          if (approval.details && !approval.uri) {
            approval.uri = 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs';
          }
        }
      } else {
        for (let i = 0; i < collection.collectionApprovals.length; i++) {
          //If we actually have details to add, we should add them to storage
          const approval = collection.collectionApprovals[i];
          if (approval.details && (approval.details?.name || approval.details?.description || approval.details?.challengeDetails || approval.details?.password)
            && (!approval.uri || approval.uri == 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs')) {
            let res = await addApprovalDetailsToOffChainStorage({
              name: approval.details?.name || '',
              description: approval.details?.description || '',
              challengeDetails: approval.details?.challengeDetails,
            });

            approval.uri = 'ipfs://' + res.result.cid;
          }
        }
      }
    }


    offChainBalancesMetadataTimeline = await getOffChainBalances(simulate);

    //I don't think this actually does anything, but the logic is we don't want any passswords / codes in the final msg accidentally
    const collectionApprovalsWithoutDetails: CollectionApproval<bigint>[] = collection.collectionApprovals?.map(y => {
      return { ...y, details: undefined }
    }) || [];


    const MsgUniversalUpdateCollection: MsgUniversalUpdateCollection<bigint> = {
      ...msg,
      creator: chain.cosmosAddress,
      collectionId: collectionId ? collectionId : 0n,
      collectionApprovals: collectionApprovalsWithoutDetails,
      badgesToCreate: txTimelineContext.badgesToCreate,
      collectionMetadataTimeline: collectionMetadataTimeline,
      badgeMetadataTimeline: badgeMetadataTimeline,
      offChainBalancesMetadataTimeline: offChainBalancesMetadataTimeline,
    }

    console.log("FINAL MSG", MsgUniversalUpdateCollection);
    return MsgUniversalUpdateCollection;
  }

  const getOffChainBalances = async (simulate?: boolean) => {

    let offChainBalancesMetadataTimeline = MsgUniversalUpdateCollection ? MsgUniversalUpdateCollection.offChainBalancesMetadataTimeline ?? [] : collection?.offChainBalancesMetadataTimeline ?? [];
    if (!txTimelineContext.updateOffChainBalancesMetadataTimeline || (!!txTimelineContext.existingCollectionId && msg.balancesType != "Off-Chain - Indexed")) {
      //Do nothing, not even if self-hosted
      offChainBalancesMetadataTimeline = []; //just for the msg, doesn't actually change the collection since update flag is false
    } else if (msg.balancesType == "Off-Chain - Indexed" && txTimelineContext.updateOffChainBalancesMetadataTimeline) {
      if (txTimelineContext.offChainAddMethod === MetadataAddMethod.UploadUrl) {
        //Do nothing (already set to self-hosted URL)
      }

      if (txTimelineContext.offChainAddMethod === MetadataAddMethod.Manual) {
        //Even if transfers are empty, we still need to add the empty map to storage

        if (!simulate) {
          //If it can be updated, we add it to centralized storage. If not, we add it to IPFS storage.
          const noManager = collection ? neverHasManager(collection) : !!(msg.updateManagerTimeline && msg.managerTimeline && (msg.managerTimeline.length == 0 || msg.managerTimeline.every(x => !x.manager)));

          const details = getPermissionDetails(
            castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []),
            TimedUpdatePermissionUsedFlags,
            noManager
          );

          const frozenForever = isCompletelyForbidden(details);

          const updatable = !frozenForever;
          const method = updatable ? 'centralized' : 'ipfs';
          const res = await createBalancesMapAndAddToStorage(collectionId, txTimelineContext.transfers, method, false);

          if (!updatable) {
            if (res.result.cid) {
              offChainBalancesMetadataTimeline = [{
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                offChainBalancesMetadata: {
                  uri: 'ipfs://' + res.result.cid,
                  customData: '',
                },
              }];
            } else throw new Error('Off-chain balances not added');
          } else {
            //if bitbadges
            if (res.uri) {
              offChainBalancesMetadataTimeline = [{
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                offChainBalancesMetadata: {
                  uri: res.uri,
                  customData: res.uri.split('/').pop() ?? '',
                },
              }];
            } else throw new Error('Off-chain balances not added');
          }
        } else {
          offChainBalancesMetadataTimeline = [{
            timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            offChainBalancesMetadata: {
              uri: 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs', //dummy for simulation
              customData: '',
            },
          }];
        }
      }
    }
    return offChainBalancesMetadataTimeline;
  }

    const beforeTx = async (simulate: boolean) => {

      if (!MsgUniversalUpdateCollection) {
        const newMsg = await getFinalMsgWithStoredUris(simulate);
        return newMsg
      } else if (MsgUniversalUpdateCollection && MsgUniversalUpdateCollection?.balancesType == "Off-Chain - Indexed") {
        //If we have off-chain balances, we should create a new URI for them
        const offChainBalancesMetadataTimeline = await getOffChainBalances(simulate);
  
        const newMsg = {
          ...msg,
          offChainBalancesMetadataTimeline: offChainBalancesMetadataTimeline,
        }
        return newMsg;
      } else {
        return msg;
      }
    }

    const txsInfo: TxInfo[] =  [
      {
        type: 'MsgUniversalUpdateCollection',
        msg: msg,
        beforeTx: beforeTx,
        afterTx: async (collectionId: bigint) => {

          if (collectionId && collectionId > 0n) {
            await fetchCollections([collectionId], true);
            await router.push(`/collections/${collectionId}`);
          } else {
            //navigating to a new collection page is handled in TxModal bc we need nextCollectionId
          }

          if (afterTxParam) await afterTxParam(collectionId);
          txTimelineContext.resetState();
        }
      }
    ]

    if (isBitBadgesFollowProtocol) {
      txsInfo.push(
        {
          type: 'MsgSetCollectionForProtocol',
          msg: {
            creator: chain.cosmosAddress,
            name: 'BitBadges Follow Protocol',
            collectionId: 0n, //tells it to get the previously created collection ID
          },
        }
    );
    }

    if (isExperiencesProtocol) {
      txsInfo.push(
        {
          type: 'MsgSetCollectionForProtocol',
          msg: {
            creator: chain.cosmosAddress,
            name: 'Experiences Protocol',
            collectionId: 0n, //tells it to get the previously created collection ID
          },
        }
      );
    }

    if (txTimelineContext.transfers.length > 0 && collection?.balancesType === 'Standard') {
      txsInfo.push({
        type: 'MsgTransferBadges',
        msg: {
          creator: chain.cosmosAddress,
          collectionId: collectionId,
          transfers: getTransfersFromTransfersWithIncrements(txTimelineContext.transfers).map(x => {
            return {
              ...x,
              toAddresses: x.toAddresses.map(y => convertToCosmosAddress(y))
            }
          })
        },
      });
    }

    console.log("TXS INFO", txsInfo);

    return txsInfo;
  }, [MsgUniversalUpdateCollection, isExperiencesProtocol, collectionId, txTimelineContext, collection, chain.cosmosAddress, router, afterTxParam, isBitBadgesFollowProtocol]);

  return (
    <TxModal
      visible={visible}
      setVisible={setVisible}
      txName="Update Collection"
    
      txsInfo={txsInfo}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}
