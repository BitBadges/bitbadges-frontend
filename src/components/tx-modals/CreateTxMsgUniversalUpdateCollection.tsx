import {
  BadgeMetadata,
  BadgeMetadataDetails,
  BadgeMetadataTimeline,
  CollectionMetadataTimeline,
  Metadata,
  MsgSetCollectionForProtocol,
  MsgTransferBadges,
  MsgUniversalUpdateCollection,
  OffChainBalancesMap,
  OffChainBalancesMetadataTimeline,
  UintRangeArray,
  convertToCosmosAddress,
  createBalanceMapForOffChainBalances,
  getTransfersFromTransfersWithIncrements
} from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { addApprovalDetailsToOffChainStorage, addMetadataToIpfs } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';

import { notification } from 'antd';
import { fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { MetadataAddMethod } from '../../bitbadges-api/types';
import { neverHasManager } from '../../bitbadges-api/utils/manager';
import { getDetailsForPermission } from '../../bitbadges-api/utils/permissions';
import { compareObjects } from '../../utils/compare';
import { TxInfo, TxModal } from './TxModal';
import { createBalancesClaimWithPlugins, createBalancesMapAndAddToStorage } from './UpdateBalancesModal';

export function CreateTxMsgUniversalUpdateCollectionModal({
  visible,
  setVisible,
  children,
  msgUniversalUpdateCollection,
  afterTxParam,
  isBitBadgesFollowProtocol,
  isExperiencesProtocol
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  children?: React.ReactNode;
  msgUniversalUpdateCollection?: MsgUniversalUpdateCollection<bigint>;
  afterTxParam?: (collectionId: bigint) => Promise<void>;
  isBitBadgesFollowProtocol?: boolean;
  isExperiencesProtocol?: boolean;
}) {
  const chain = useChainContext();
  const router = useRouter();

  const txTimelineContext = useTxTimelineContext();
  const collectionId = txTimelineContext.existingCollectionId ?? NEW_COLLECTION_ID;
  const collection = useCollection(NEW_COLLECTION_ID);

  const txsInfo = useMemo(() => {
    if (!collection) return [];

    const msg: MsgUniversalUpdateCollection<bigint> =
      msgUniversalUpdateCollection ??
      new MsgUniversalUpdateCollection<bigint>({
        creator: chain.cosmosAddress,
        collectionId: collectionId ? collectionId : 0n,
        defaultBalances: collection.defaultBalances,
        badgesToCreate: txTimelineContext.badgesToCreate,
        updateCollectionPermissions: txTimelineContext.updateCollectionPermissions,
        balancesType: collection ? collection?.balancesType : '',
        collectionPermissions: collection.collectionPermissions,
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
        isArchivedTimeline: collection ? collection?.isArchivedTimeline : []
      });

    //This function basically takes all relevant details from collection / txTimelineContext that need to be added to IPFS and adds them
    //It then returns a new final msg with the updated URIs to be broadcasted on-chain
    //If simulate is true, it will return a msg with dummy URIs
    //Eventually, we should probably parallelize this
    async function getFinalMsgWithStoredUris(simulate: boolean) {
      if (!txTimelineContext || !collection) return;

      let offChainBalancesMetadataTimeline = collection.offChainBalancesMetadataTimeline.map((x) => x.clone());
      let collectionMetadataTimeline = collection.collectionMetadataTimeline.map((x) => x.clone());
      let badgeMetadataTimeline = collection.badgeMetadataTimeline.map((x) => x.clone());
      const collectionApprovalsTimeline = collection.collectionApprovals.map((x) => x.clone());
      const prunedMetadata: Array<BadgeMetadataDetails<bigint>> = collection.cachedBadgeMetadata
        .map((x) => x.clone())
        .filter((x) => x.badgeIds.length > 0 && x.toUpdate && !compareObjects(Metadata.DefaultPlaceholderMetadata(), x.metadata));

      //If metadata was added manually, we need to add it to IPFS and update the URIs in msg
      //If metadata was added with a URI, the timeline should already be updated with the final URI
      if (txTimelineContext.updateBadgeMetadataTimeline || txTimelineContext.updateCollectionMetadataTimeline) {
        if (simulate) {
          if (txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual && txTimelineContext.updateCollectionMetadataTimeline) {
            for (const x of collectionMetadataTimeline) {
              x.collectionMetadata.uri = 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs';
            }
          }
          if (txTimelineContext.badgeAddMethod === MetadataAddMethod.Manual && txTimelineContext.updateBadgeMetadataTimeline) {
            for (const x of badgeMetadataTimeline) {
              for (const y of x.badgeMetadata) {
                y.uri = 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs';
              }
            }
          }
        } else {
          const body = {
            collectionMetadata:
              txTimelineContext.updateCollectionMetadataTimeline && txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual
                ? collection.cachedCollectionMetadata
                : undefined,
            badgeMetadata:
              txTimelineContext.updateBadgeMetadataTimeline && txTimelineContext.badgeAddMethod === MetadataAddMethod.Manual
                ? prunedMetadata
                : undefined
          };

          const toUpload = body.collectionMetadata || body.badgeMetadata;
          if (toUpload) {
            notification.info({
              message: 'Uploading metadata',
              description: "Give us a second to handle the uploading of your collection's metadata to IPFS."
            });

            const res = await addMetadataToIpfs(body);
            // if (!res.collectionMetadataResult) throw new Error('Collection metadata not added to IPFS');

            if (txTimelineContext.updateCollectionMetadataTimeline && txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual) {
              collectionMetadataTimeline = [
                new CollectionMetadataTimeline({
                  timelineTimes: UintRangeArray.FullRanges(),
                  collectionMetadata: {
                    uri: 'ipfs://' + res.collectionMetadataResult?.cid,
                    customData: ''
                  }
                })
              ];
            }

            if (txTimelineContext.updateBadgeMetadataTimeline && txTimelineContext.badgeAddMethod === MetadataAddMethod.Manual) {
              const newBadgeMetadataTimeline: Array<BadgeMetadataTimeline<bigint>> = [
                new BadgeMetadataTimeline({
                  timelineTimes: UintRangeArray.FullRanges(),
                  badgeMetadata: []
                })
              ];

              //First, we add the new metadata that should be updated
              for (let i = 0; i < prunedMetadata.length; i++) {
                const metadata = prunedMetadata[i];
                const result = res.badgeMetadataResults[i];

                newBadgeMetadataTimeline[0].badgeMetadata.push(
                  new BadgeMetadata({
                    uri: 'ipfs://' + result.cid,
                    badgeIds: metadata.badgeIds,
                    customData: ''
                  })
                );

                metadata.uri = 'ipfs://' + result.cid;
              }

              //Next, we add any existing metadata that wasn't updated
              if (badgeMetadataTimeline.length > 0 && badgeMetadataTimeline[0].badgeMetadata.length > 0) {
                newBadgeMetadataTimeline[0].badgeMetadata.push(...badgeMetadataTimeline[0].badgeMetadata);
              }

              //Add default placeholder metadata for any badges that don't have metadata (IDs > max)
              //Permissions should be set to allow updating this metadata
              newBadgeMetadataTimeline[0].badgeMetadata.push(
                new BadgeMetadata({
                  uri: 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs',
                  badgeIds: UintRangeArray.FullRanges(),
                  customData: ''
                })
              );

              //Get first match only. Thus, we prioritize updates -> existing -> not handled in that order
              newBadgeMetadataTimeline[0].badgeMetadata = BadgeMetadata.getFirstMatches(newBadgeMetadataTimeline[0].badgeMetadata).filter(
                (x) => x.badgeIds.length > 0
              );

              badgeMetadataTimeline = newBadgeMetadataTimeline;
            }
          }
        }
      }

      //If distribution method is codes or a whitelist, we need to add the merkle tree to IPFS and update the claim URI
      if (collectionApprovalsTimeline?.length > 0 && txTimelineContext.updateCollectionApprovals) {
        if (simulate) {
          for (let i = 0; i < collectionApprovalsTimeline.length; i++) {
            const approval = collectionApprovalsTimeline[i];
            if (approval.details && !approval.uri) {
              approval.uri = 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs';
            }
          }
        } else {
          for (let i = 0; i < collectionApprovalsTimeline.length; i++) {
            //If we actually have details to add, we should add them to storage
            const approval = collectionApprovalsTimeline[i];

            if (
              approval.details &&
              (approval.details?.name ||
                approval.details?.description ||
                approval.details?.challengeDetails ||
                approval.details?.offChainClaims?.length)
            ) {
              const res = await addApprovalDetailsToOffChainStorage({
                name: approval.details?.name || '',
                description: approval.details?.description || '',
                challengeDetails: approval.details?.challengeDetails,
                offChainClaims: approval.details?.offChainClaims
              });

              approval.uri = 'ipfs://' + res.result.cid;
            }
          }
        }
      }

      offChainBalancesMetadataTimeline = await getOffChainBalances(simulate);

      const msgUniversalUpdateCollection = new MsgUniversalUpdateCollection({
        ...msg,
        creator: chain.cosmosAddress,
        collectionId: collectionId ? collectionId : 0n,

        //I don't think this actually does anything, but the logic is we don't want any passswords / codes in the final msg accidentally
        collectionApprovals: collectionApprovalsTimeline.map((x) => {
          return {
            ...x,
            details: undefined
          };
        }),
        badgesToCreate: txTimelineContext.badgesToCreate,
        collectionMetadataTimeline: collectionMetadataTimeline,
        badgeMetadataTimeline: badgeMetadataTimeline,
        offChainBalancesMetadataTimeline: offChainBalancesMetadataTimeline
      });

      if (!simulate) {
        notification.info({
          message: 'Uploaded successfully',
          description: 'Please proceed to sign the transaction after verifying all details are correct.'
        });
      }

      console.log('FINAL MSG', msgUniversalUpdateCollection);
      return msgUniversalUpdateCollection;
    }

    const getOffChainBalances = async (simulate?: boolean) => {
      let offChainBalancesMetadataTimeline = msgUniversalUpdateCollection
        ? msgUniversalUpdateCollection.offChainBalancesMetadataTimeline ?? []
        : collection?.offChainBalancesMetadataTimeline ?? [];

      if (!collection) {
        throw new Error('Collection not found');
      }

      if (!txTimelineContext.updateOffChainBalancesMetadataTimeline || (!!txTimelineContext.existingCollectionId && msg.balancesType == 'Standard')) {
        //Do nothing, not even if self-hosted
        offChainBalancesMetadataTimeline = []; //just for the msg, doesn't actually change the collection since update flag is false
      } else if (
        (msg.balancesType == 'Off-Chain - Indexed' || msg.balancesType === 'Off-Chain - Non-Indexed') &&
        txTimelineContext.updateOffChainBalancesMetadataTimeline
      ) {
        if (txTimelineContext.offChainAddMethod === MetadataAddMethod.UploadUrl) {
          //Do nothing (already set to self-hosted URL)
        }

        if (txTimelineContext.offChainAddMethod === MetadataAddMethod.Manual || txTimelineContext.offChainAddMethod === MetadataAddMethod.Plugins) {
          //Even if transfers are empty, we still need to add the empty map to storage

          if (!simulate) {
            //If it can be updated, we add it to centralized storage. If not, we add it to IPFS storage.
            const noManager = collection
              ? neverHasManager(collection)
              : !!(
                  msg.updateManagerTimeline &&
                  msg.managerTimeline &&
                  (msg.managerTimeline.length == 0 || msg.managerTimeline.every((x) => !x.manager))
                );

            const details = getDetailsForPermission(
              collection?.collectionPermissions.canUpdateOffChainBalancesMetadata ?? [],
              'canUpdateOffChainBalancesMetadata'
            );
            const frozenForever = details.isAlwaysFrozenAndForbidden || noManager;

            const updatable = !frozenForever || collection.balancesType === 'Off-Chain - Non-Indexed';
            const method = updatable ? 'centralized' : 'ipfs';
            const transfersToAdd = txTimelineContext.offChainAddMethod === MetadataAddMethod.Manual ? txTimelineContext.transfers : [];

            const _balanceMap = await createBalanceMapForOffChainBalances(transfersToAdd);

            const balanceMap: OffChainBalancesMap<bigint> = {};
            for (const entries of Object.entries(_balanceMap)) {
              const [key, value] = entries;
              balanceMap[convertToCosmosAddress(key)] = value;
            }

            let res;
            if (txTimelineContext.offChainAddMethod === MetadataAddMethod.Plugins) {
              res = await createBalancesClaimWithPlugins(
                collectionId,
                method,
                collection.offChainClaims,
                !txTimelineContext.existingCollectionId,
                false
              );
            } else {
              res = await createBalancesMapAndAddToStorage(collectionId, transfersToAdd, method, false);
            }

            if (
              !!txTimelineContext.existingCollectionId &&
              txTimelineContext.existingCollectionId > 0 &&
              txTimelineContext.offChainAddMethod === MetadataAddMethod.Plugins
            ) {
              //Don't do anything with the timeline (URI stays the same)
            } else if (!updatable) {
              if (res.result.cid) {
                offChainBalancesMetadataTimeline = [
                  new OffChainBalancesMetadataTimeline({
                    timelineTimes: UintRangeArray.FullRanges(),
                    offChainBalancesMetadata: {
                      uri: 'ipfs://' + res.result.cid,
                      customData: ''
                    }
                  })
                ];
              } else throw new Error('Off-chain balances not added');
            } else {
              //if bitbadges (indexed and non-indexed)
              if (res.uri) {
                offChainBalancesMetadataTimeline = [
                  new OffChainBalancesMetadataTimeline({
                    timelineTimes: UintRangeArray.FullRanges(),
                    offChainBalancesMetadata: {
                      uri: collection.balancesType === 'Off-Chain - Non-Indexed' ? 'https://api.bitbadges.io/placeholder/{address}' : res.uri,
                      customData: res.uri.split('/').pop() ?? ''
                    }
                  })
                ];
              } else throw new Error('Off-chain balances not added');
            }
          } else {
            let uri = 'https://api.bitbadges.io/placeholder/{address}';
            if (collection.balancesType === 'Off-Chain - Indexed') {
              uri = 'ipfs://QmQKn1G41gcVEZPenXjtTTQfQJnx5Q6fDtZrcSNJvBqxUs'; //dummy for simulation
            }
            offChainBalancesMetadataTimeline = [
              new OffChainBalancesMetadataTimeline({
                timelineTimes: UintRangeArray.FullRanges(),
                offChainBalancesMetadata: {
                  uri,
                  customData: ''
                }
              })
            ];
          }
        }
      }
      return offChainBalancesMetadataTimeline;
    };

    const beforeTx = async (simulate: boolean) => {
      if (!msgUniversalUpdateCollection) {
        const newMsg = await getFinalMsgWithStoredUris(simulate);
        return newMsg;
      } else if (msgUniversalUpdateCollection && msgUniversalUpdateCollection?.balancesType == 'Off-Chain - Indexed') {
        //If we have off-chain balances, we should create a new URI for them
        const offChainBalancesMetadataTimeline = await getOffChainBalances(simulate);

        const newMsg = new MsgUniversalUpdateCollection({
          ...msg,
          offChainBalancesMetadataTimeline: offChainBalancesMetadataTimeline
        });
        return newMsg;
      } else {
        return msg;
      }
    };

    const txsInfo: TxInfo[] = [
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
        }
      }
    ];

    if (isBitBadgesFollowProtocol) {
      txsInfo.push({
        type: 'MsgSetCollectionForProtocol',
        msg: new MsgSetCollectionForProtocol({
          creator: chain.cosmosAddress,
          name: 'BitBadges Follow Protocol',
          collectionId: 0n //tells it to get the previously created collection ID
        })
      });
    }

    if (isExperiencesProtocol) {
      txsInfo.push({
        type: 'MsgSetCollectionForProtocol',
        msg: new MsgSetCollectionForProtocol({
          creator: chain.cosmosAddress,
          name: 'Experiences Protocol',
          collectionId: 0n //tells it to get the previously created collection ID
        })
      });
    }

    if (txTimelineContext.transfers.length > 0 && collection?.balancesType === 'Standard') {
      txsInfo.push({
        type: 'MsgTransferBadges',
        msg: new MsgTransferBadges({
          creator: chain.cosmosAddress,
          collectionId: collectionId,
          transfers: getTransfersFromTransfersWithIncrements(txTimelineContext.transfers).map((x) => {
            return {
              ...x,
              toAddresses: x.toAddresses.map((y) => convertToCosmosAddress(y))
            };
          })
        })
      });
    }

    console.log('TXS INFO', txsInfo);

    return txsInfo;
  }, [
    msgUniversalUpdateCollection,
    isExperiencesProtocol,
    collectionId,
    txTimelineContext,
    collection,
    chain.cosmosAddress,
    router,
    afterTxParam,
    isBitBadgesFollowProtocol
  ]);

  return (
    <TxModal visible={visible} setVisible={setVisible} txName="Update Collection" txsInfo={txsInfo} requireLogin>
      {children}
    </TxModal>
  );
}
