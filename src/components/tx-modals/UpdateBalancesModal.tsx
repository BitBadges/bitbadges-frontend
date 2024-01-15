import { CloseOutlined } from '@ant-design/icons';
import { Divider, Modal, Spin, message, notification } from 'antd';
import { BigIntify, BitBadgesCollection, OffChainBalancesMap, TransferWithIncrements, convertOffChainBalancesMap, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { createBalanceMapForOffChainBalances } from 'bitbadgesjs-utils/dist/distribution';
import React, { useState } from 'react';
import { addBalancesToOffChainStorage, fetchMetadataDirectly, getCollections } from '../../bitbadges-api/api';
import { getCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { DistributionComponent } from '../tx-timelines/step-items/OffChainBalancesStepItem';
import { DisconnectedWrapper } from '../wrappers/DisconnectedWrapper';

const getCollectionFromId = async (collectionId: bigint) => {
  let collection = getCollection(collectionId);
  if (!collection) {
    const res = await getCollections({ collectionsToFetch: [{ collectionId }] });
    collection = res.collections[0];
  }

  return collection
}

export const getExistingBalanceMap = async (collection: BitBadgesCollection<bigint>) => {
  if (collection.balancesType !== 'Off-Chain - Indexed' || collection.offChainBalancesMetadataTimeline.length === 0 || !collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges-balances.nyc3.digitaloceanspaces.com/balances/')) {
    message.error('The collection you are trying to set balances for is custom created. You will have to assign balances manually.');
    throw new Error('The collection you are trying to set balances for is custom created. You will have to assign balances manually.');
  }

  const offChainBalancesMapRes = await fetchMetadataDirectly({
    uris: [collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri]
  });

  //filter undefined entries
  const filteredMap = Object.entries(offChainBalancesMapRes.metadata[0] as any).filter(([, balances]) => {
    return !!balances;
  }).reduce((obj, [cosmosAddress, balances]) => {
    obj[cosmosAddress] = balances;
    return obj;
  }, {} as any);

  return convertOffChainBalancesMap(filteredMap as any, BigIntify)
}

export const removeBalancesFromExistingBalancesMapAndAddToStorage = async (collectionId: bigint, addresses: string[], method: 'ipfs' | 'centralized', notify: boolean) => {
  const followCollection = await getCollectionFromId(collectionId);
  const balancesMap = await getExistingBalanceMap(followCollection);
  const newTransfers: TransferWithIncrements<bigint>[] = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
    return {
      from: 'Mint',
      toAddresses: [cosmosAddress],
      balances,
    }
  }).filter(x => !addresses.includes(x.toAddresses[0]));

  return await createBalancesMapAndAddToStorage(collectionId, newTransfers, method, notify);
}

export const setTransfersForExistingBalancesMapAndAddToStorage = async (collectionId: bigint, transfers: TransferWithIncrements<bigint>[], method: 'ipfs' | 'centralized', notify: boolean) => {
  const followCollection = await getCollectionFromId(collectionId);
  const balancesMap = await getExistingBalanceMap(followCollection);
  const newTransfers: TransferWithIncrements<bigint>[] = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
    return {
      from: 'Mint',
      toAddresses: [cosmosAddress],
      balances,
    }
  }).filter(x => !transfers.find(y => y.toAddresses[0] === x.toAddresses[0]));
  newTransfers.push(...transfers);

  return await createBalancesMapAndAddToStorage(collectionId, newTransfers, method, notify);
}

export const addTransfersToExistingBalancesMapAndAddToStorage = async (collectionId: bigint, transfers: TransferWithIncrements<bigint>[], method: 'ipfs' | 'centralized', notify: boolean) => {
  let followCollection = await getCollectionFromId(collectionId);
  const balancesMap = await getExistingBalanceMap(followCollection);
  const newTransfers: TransferWithIncrements<bigint>[] = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
    return {
      from: 'Mint',
      toAddresses: [cosmosAddress],
      balances,
    }
  });
  newTransfers.push(...transfers);
  return await createBalancesMapAndAddToStorage(collectionId, transfers, method, notify);
}

export const createBalancesMapAndAddToStorage = async (collectionId: bigint, transfers: TransferWithIncrements<bigint>[], method: 'ipfs' | 'centralized', notify: boolean) => {
  const _balanceMap = await createBalanceMapForOffChainBalances(transfers);

  const balanceMap: OffChainBalancesMap<bigint> = {};
  for (const entries of Object.entries(_balanceMap)) {
    const [key, value] = entries;
    balanceMap[convertToCosmosAddress(key)] = value;
  }

  const res = await addBalancesToOffChainStorage({ balances: balanceMap, method, collectionId: collectionId, });

  if (notify) {
    notification.success({
      message: 'Success',
      description: 'Balances updated for this collection. It may take a few minutes for the changes to be reflected.',
    });
  }

  return res
}

export function UpdateBalancesModal({ visible, setVisible, children, collectionId }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  return (
    <Modal
      title={<div className='primary-text inherit-bg'><b>{'Distribute'}</b></div>}
      open={visible}
      width={'90%'}
      footer={null}
      closeIcon={<div className='primary-text inherit-bg'>{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
      }}
      onCancel={() => setVisible(false)}
      destroyOnClose={true}
      className='primary-text'
    >
      <DisconnectedWrapper
        requireLogin
        message='Please connect and sign in to your wallet to distribute badges.'
        node={<>
          {<>
            <DistributionComponent collectionIdOverride={collectionId} setTransfersOverride={setTransfers} transfersOverride={transfers} />
            <Divider />
            <Divider />
            <button
              disabled={transfers.length == 0 || loading}
              className='landing-button'
              style={{ width: '100%', marginTop: 20 }}
              onClick={async () => {
                setLoading(true);
                await createBalancesMapAndAddToStorage(collectionId, transfers, 'centralized', true);
                setLoading(false);
                setVisible(false);
              }}>
              Update Balances {loading && <Spin />}
            </button>
            {children}
          </>}
        </>}
      />
    </Modal>
  );
}