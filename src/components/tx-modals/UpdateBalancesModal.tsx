import { Divider, Spin, message, notification } from 'antd';
import {
  BalanceArray,
  BigIntify,
  BitBadgesCollection,
  ClaimIntegrationPluginType,
  IncrementedBalances,
  OffChainBalancesMap,
  TransferWithIncrements,
  convertOffChainBalancesMap,
  convertToCosmosAddress,
  createBalanceMapForOffChainBalances
} from 'bitbadgesjs-sdk';
import crypto from 'crypto';
import React, { useEffect, useState } from 'react';
import { BitBadgesApi, addBalancesToOffChainStorage, fetchMetadataDirectly, getCollections } from '../../bitbadges-api/api';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { getCollection, updateCollection, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { MetadataAddMethod } from '../../bitbadges-api/types';
import { IntegrationPluginDetails, getBlankPlugin } from '../../integrations/integrations';
import { GenericModal } from '../display/GenericModal';
import { RadioGroup } from '../inputs/Selects';
import { DistributionComponent, OffChainClaim, OffChainClaimBuilder } from '../tx-timelines/step-items/OffChainBalancesStepItem';

const getCollectionFromId = async (collectionId: bigint) => {
  let collection = getCollection(collectionId);
  if (!collection) {
    const res = await getCollections({ collectionsToFetch: [{ collectionId }] });
    collection = res.collections[0];
  }

  return collection;
};

export const getExistingBalanceMap = async (collection: Readonly<BitBadgesCollection<bigint>>) => {
  if (
    collection.balancesType !== 'Off-Chain - Indexed' ||
    collection.offChainBalancesMetadataTimeline.length === 0 ||
    !collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith(
      'https://bitbadges-balances.nyc3.digitaloceanspaces.com/balances/'
    )
  ) {
    message.error('The collection you are trying to set balances for is custom created. You will have to assign balances manually.');
    throw new Error('The collection you are trying to set balances for is custom created. You will have to assign balances manually.');
  }

  const offChainBalancesMapRes = await fetchMetadataDirectly({
    uris: [collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri]
  });

  //filter undefined entries
  const filteredMap = Object.entries(offChainBalancesMapRes.metadata[0] as any)
    .filter(([, balances]) => {
      return !!balances;
    })
    .reduce<any>((obj, [cosmosAddress, balances]) => {
      obj[cosmosAddress] = balances;
      return obj;
    }, {});

  return convertOffChainBalancesMap(filteredMap, BigIntify);
};

export const removeBalancesFromExistingBalancesMapAndAddToStorage = async (
  collectionId: bigint,
  addresses: string[],
  method: 'ipfs' | 'centralized',
  notify: boolean
) => {
  const followCollection = await getCollectionFromId(collectionId);
  const balancesMap = await getExistingBalanceMap(followCollection);
  const newTransfers: Array<TransferWithIncrements<bigint>> = Object.entries(balancesMap)
    .map(([cosmosAddress, balances]) => {
      return new TransferWithIncrements({
        from: 'Mint',
        toAddresses: [cosmosAddress],
        balances
      });
    })
    .filter((x) => !addresses.includes(x.toAddresses[0]));

  return await createBalancesMapAndAddToStorage(collectionId, newTransfers, method, notify);
};

export const setTransfersForExistingBalancesMapAndAddToStorage = async (
  collectionId: bigint,
  transfers: Array<TransferWithIncrements<bigint>>,
  method: 'ipfs' | 'centralized',
  notify: boolean
) => {
  const followCollection = await getCollectionFromId(collectionId);
  const balancesMap = await getExistingBalanceMap(followCollection);
  const newTransfers: Array<TransferWithIncrements<bigint>> = Object.entries(balancesMap)
    .map(([cosmosAddress, balances]) => {
      return new TransferWithIncrements({
        from: 'Mint',
        toAddresses: [cosmosAddress],
        balances
      });
    })
    .filter((x) => !transfers.find((y) => y.toAddresses[0] === x.toAddresses[0]));
  newTransfers.push(...transfers);

  return await createBalancesMapAndAddToStorage(collectionId, newTransfers, method, notify);
};

export const addTransfersToExistingBalancesMapAndAddToStorage = async (
  collectionId: bigint,
  transfers: Array<TransferWithIncrements<bigint>>,
  method: 'ipfs' | 'centralized',
  notify: boolean
) => {
  const followCollection = await getCollectionFromId(collectionId);
  const balancesMap = await getExistingBalanceMap(followCollection);
  const newTransfers: Array<TransferWithIncrements<bigint>> = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
    return new TransferWithIncrements({
      from: 'Mint',
      toAddresses: [cosmosAddress],
      balances
    });
  });
  newTransfers.push(...transfers);
  return await createBalancesMapAndAddToStorage(collectionId, transfers, method, notify);
};

export const createBalancesMapAndAddToStorage = async (
  collectionId: bigint,
  transfers: Array<TransferWithIncrements<bigint>>,
  method: 'ipfs' | 'centralized',
  notify: boolean
) => {
  const _balanceMap = await createBalanceMapForOffChainBalances(transfers);

  const balanceMap: OffChainBalancesMap<bigint> = {};
  for (const entries of Object.entries(_balanceMap)) {
    const [key, value] = entries;
    balanceMap[convertToCosmosAddress(key)] = value;
  }

  const res = await addBalancesToOffChainStorage({
    balances: balanceMap,
    method,
    collectionId: collectionId
  });

  if (notify) {
    notification.success({
      message: 'Success',
      description: 'Balances updated for this collection. It may take a few minutes for the changes to be reflected.'
    });
  }

  return res;
};

export const createBalancesClaimWithPlugins = async (
  collectionId: bigint,
  method: 'ipfs' | 'centralized',
  plugins: Array<IntegrationPluginDetails<ClaimIntegrationPluginType>>,
  balancesToSet: IncrementedBalances<bigint>,
  claimId: string,
  isGenesis: boolean,
  notify: boolean
) => {
  const balanceMap: OffChainBalancesMap<bigint> = {};
  const res = await BitBadgesApi.addBalancesToOffChainStorage({
    // If plugins, we instantiate a new map initially (genesis) but leave as is if not
    balances: isGenesis ? balanceMap : undefined,
    offChainClaims: plugins.length > 0 ? [{ balancesToSet, plugins, claimId }] : undefined,
    collectionId: collectionId,
    method
  });

  if (notify) {
    notification.success({
      message: 'Success',
      description: 'Balances updated for this collection. It may take a few minutes for the changes to be reflected.'
    });
  }

  return res;
};

export function UpdateBalancesModal({
  visible,
  setVisible,
  children,
  collectionId
}: {
  collectionId: bigint;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  children?: React.ReactNode;
}) {
  const collection = useCollection(collectionId);

  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState<Array<TransferWithIncrements<bigint>>>([]);
  const [offChainClaims, setOffChainClaims] = useState<Array<OffChainClaim<bigint>>>([]);
  const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.Manual);
  const [existingOffChainClaims, setExistingOffChainClaims] = useState<Array<OffChainClaim<bigint>>>([]);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (collectionId === NEW_COLLECTION_ID) return;

    async function fetchCollection() {
      await BitBadgesApi.getCollections({ collectionsToFetch: [{ collectionId, fetchPrivateParams: true }] }).then((res) => {
        const collection = res.collections[0];
        if (collection && collection?.offChainClaims.length > 0) {
          setAddMethod(MetadataAddMethod.Plugins);
          setOffChainClaims(collection?.offChainClaims);
          setExistingOffChainClaims(collection?.offChainClaims);
        }
      });
    }

    fetchCollection();
  }, [collectionId]);

  return (
    <GenericModal title="Distribute" visible={visible} setVisible={setVisible} style={{ minWidth: '90%' }} requireConnected requireLoggedIn>
      <div className="flex-center">
        <RadioGroup
          value={addMethod === MetadataAddMethod.Manual ? 'manual' : addMethod === MetadataAddMethod.Plugins ? 'plugins' : 'upload'}
          onChange={(e) => {
            setTransfers([]);

            if (e === 'manual') {
              setAddMethod(MetadataAddMethod.Manual);
              updateCollection({
                collectionId: NEW_COLLECTION_ID,
                offChainClaims: []
              });
            } else if (e === 'plugins') {
              setAddMethod(MetadataAddMethod.Plugins);
              setOffChainClaims(
                existingOffChainClaims.length > 0
                  ? existingOffChainClaims
                  : [
                      {
                        claimId: crypto.randomBytes(32).toString('hex'),
                        balancesToSet: new IncrementedBalances({
                          startBalances: new BalanceArray(),
                          incrementBadgeIdsBy: 0n,
                          incrementOwnershipTimesBy: 0n
                        }),
                        plugins: [getBlankPlugin('numUses'), getBlankPlugin('requiresProofOfAddress')]
                      }
                    ]
              );
            }
          }}
          options={[
            {
              label: 'Manual',
              value: 'manual'
            },
            {
              label: 'Plugins',
              value: 'plugins'
            }
          ]}
        />
      </div>

      {addMethod === MetadataAddMethod.Manual && (
        <>{<DistributionComponent collectionIdOverride={collectionId} setTransfersOverride={setTransfers} transfersOverride={transfers} />}</>
      )}
      {addMethod === MetadataAddMethod.Plugins && offChainClaims.length > 0 && collection && (
        <OffChainClaimBuilder
          collectionId={collection?.collectionId}
          offChainClaims={offChainClaims}
          setOffChainClaims={(newClaims) => {
            setOffChainClaims(newClaims);
          }}
          setDisabled={setDisabled}
          isUpdateBalancesModal
        />
      )}
      <Divider />
      <Divider />
      <button
        disabled={
          loading ||
          disabled ||
          (addMethod === MetadataAddMethod.Manual && transfers.length == 0) ||
          (addMethod === MetadataAddMethod.Plugins && offChainClaims.length == 0) ||
          (addMethod === MetadataAddMethod.Plugins && offChainClaims[0].balancesToSet?.startBalances.length == 0) ||
          (addMethod === MetadataAddMethod.Plugins && !offChainClaims[0].plugins.some((x) => x.id !== 'numUses'))
        }
        className="landing-button"
        style={{ width: '100%', marginTop: 20 }}
        onClick={async () => {
          setLoading(true);

          if (addMethod === MetadataAddMethod.Manual) {
            await createBalancesMapAndAddToStorage(collectionId, transfers, 'centralized', true);
          } else if (addMethod === MetadataAddMethod.Plugins) {
            if (offChainClaims.length > 0) {
              await createBalancesClaimWithPlugins(
                collectionId,
                'centralized',
                offChainClaims[0].plugins,
                offChainClaims[0].balancesToSet ??
                  new IncrementedBalances({ startBalances: new BalanceArray(), incrementBadgeIdsBy: 0n, incrementOwnershipTimesBy: 0n }),
                offChainClaims[0].claimId,
                false,
                true
              );
            } else {
              throw new Error('No offChainClaims');
            }
          }
          setLoading(false);
          setVisible(false);
        }}>
        Update Balances {loading && <Spin />}
      </button>
      {children}
    </GenericModal>
  );
}
