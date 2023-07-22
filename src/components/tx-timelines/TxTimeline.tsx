import { Divider, Spin } from 'antd';
import { Balance, CollectionPermissions, NumberType } from 'bitbadgesjs-proto';
import { BLANK_USER_INFO, DefaultPlaceholderMetadata, DistributionMethod, MetadataAddMethod, TransferWithIncrements, incrementMintAndTotalBalances, removeBadgeMetadata, updateBadgeMetadata } from 'bitbadgesjs-utils';
import { useEffect, useRef, useState } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { UpdateCollectionTimeline } from './UpdateCollectionTimeline';

export const EmptyStepItem = {
  title: '',
  description: '',
  node: <></>,
  doNotDisplay: true,
}

export const MSG_PREVIEW_ID = 0n;

//Each timeline makes use of the necessary, reusable components in the step-items and form-items folders.
//The step-items are the individual steps in the timeline, and the form-items are the helper components that are displayed in each step.


/*
  IMPORTANT FOR DEVELOPERS: Read below
  
  Do not update any of the existingCollection or collectionsContext.getCollection(existingCollectionId) fields.
  Instead, use the simulated collection with ID === 0n aka ID === MSG_PREVIEW_ID. 
  The simulated collection is a copy of the existing collection with the changes specified by the Msg applied to it.
  This is because we want to be able to simulate the changes to the collection and access them without actually updating the collection in the cache.

  Minor hacks applied:
  -badgesToCreate is exported in TxTimelineProps, and we automatically update "Mint" and "Total" balances to reflect the new total and mint balances
  -merkleChallenges are handled via the collectionApprovedTransfersTimeline field of the collections from the collections context. Here, there is an extra field called details
    which specifies extra details about the merkle challenge (name, description, password, preimage codes, etc). These are to be uploaded to IPFS but removed before creating the Msg.
  -transfers should only be used for off-chain balances

  DO NOT UPDATE THE MINT OR TRANSFER BALANCES DIRECTLY. Use badgesToCreate instead.
*/

export interface CreateAndDistributeMsg<T extends NumberType> {
  transfers: TransferWithIncrements<T>[]
  setTransfers: (transfers: TransferWithIncrements<T>[]) => void
  badgesToCreate: Balance<T>[];
  setBadgesToCreate: (badgesToCreate: Balance<T>[]) => void

  //TODO: abstract this better so we can have multiple distribution methods for different transfers
  distributionMethod: DistributionMethod
  setDistributionMethod: (method: DistributionMethod) => void
}


export interface NewCollection {
  handledPermissions: CollectionPermissions<bigint>
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void
}

export interface UpdateMetadataMsg {
  addMethod: MetadataAddMethod
  setAddMethod: (method: MetadataAddMethod) => void
  metadataSize: number
}

export interface UpdateFlags {
  updateCollectionPermissions: boolean;
  setUpdateCollectionPermissions: (value: boolean) => void;
  updateManagerTimeline: boolean;
  setUpdateManagerTimeline: (value: boolean) => void;
  updateCollectionMetadataTimeline: boolean;
  setUpdateCollectionMetadataTimeline: (value: boolean) => void;
  updateBadgeMetadataTimeline: boolean;
  setUpdateBadgeMetadataTimeline: (value: boolean) => void;
  updateOffChainBalancesMetadataTimeline: boolean;
  setUpdateOffChainBalancesMetadataTimeline: (value: boolean) => void;
  updateCustomDataTimeline: boolean;
  setUpdateCustomDataTimeline: (value: boolean) => void;
  updateInheritedBalancesTimeline: boolean;
  setUpdateInheritedBalancesTimeline: (value: boolean) => void;
  updateCollectionApprovedTransfersTimeline: boolean;
  setUpdateCollectionApprovedTransfersTimeline: (value: boolean) => void;
  updateStandardsTimeline: boolean;
  setUpdateStandardsTimeline: (value: boolean) => void;
  updateContractAddressTimeline: boolean;
  setUpdateContractAddressTimeline: (value: boolean) => void;
  updateIsArchivedTimeline: boolean;
  setUpdateIsArchivedTimeline: (value: boolean) => void;
}

export type MsgUpdateCollectionProps = UpdateFlags & BaseTxTimelineProps & NewCollection & CreateAndDistributeMsg<bigint> & UpdateMetadataMsg & { onFinish: (props: BaseTxTimelineProps & NewCollection & CreateAndDistributeMsg<bigint> & UpdateMetadataMsg) => void };

export interface BaseTxTimelineProps {
  txType: 'UpdateCollection'
  existingCollectionId?: bigint
  onFinish?: (props: BaseTxTimelineProps & NewCollection & CreateAndDistributeMsg<bigint> & UpdateMetadataMsg) => void
}

export function TxTimeline({
  txType,
  collectionId,
  onFinish,
  isModal
}: {
  txType: 'UpdateCollection'
  collectionId?: bigint,
  onFinish?: ((props: MsgUpdateCollectionProps) => void),
  isModal?: boolean
}) {
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);

  const existingCollection = collectionId ? collections.collections[collectionId.toString()] : undefined;
  const simulatedCollection = collections.collections[MSG_PREVIEW_ID.toString()];

  const [size, setSize] = useState(0);
  const [badgesToCreate, setBadgesToCreate] = useState<Balance<bigint>[]>([]);
  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [initialLoad, setInitialLoad] = useState(false);

  //Update flags
  const [updateCollectionPermissions, setUpdateCollectionPermissions] = useState(true);
  const [updateManagerTimeline, setUpdateManagerTimeline] = useState(true);
  const [updateCollectionMetadataTimeline, setUpdateCollectionMetadataTimeline] = useState(true);
  const [updateBadgeMetadataTimeline, setUpdateBadgeMetadataTimeline] = useState(true);
  const [updateOffChainBalancesMetadataTimeline, setUpdateOffChainBalancesMetadataTimeline] = useState(true);
  const [updateCustomDataTimeline, setUpdateCustomDataTimeline] = useState(true);
  const [updateInheritedBalancesTimeline, setUpdateInheritedBalancesTimeline] = useState(true);
  const [updateCollectionApprovedTransfersTimeline, setUpdateCollectionApprovedTransfersTimeline] = useState(true);
  const [updateStandardsTimeline, setUpdateStandardsTimeline] = useState(true);
  const [updateContractAddressTimeline, setUpdateContractAddressTimeline] = useState(true);
  const [updateIsArchivedTimeline, setUpdateIsArchivedTimeline] = useState(true);



  //Only upon first load, we fetch the collection from the server if it exists
  //Set default values for the collection if it doesn't exist or populate with exsitng values if it does
  //Throughout the timeline, we never update the existing collection, only the simulated collection with ID === 0n
  useEffect(() => {
    async function initialize() {

      const existingCollectionsRes = collectionId && collectionId > 0n ? await collectionsRef.current.fetchCollections([collectionId], true) : [];
      const existingCollection = collectionId && collectionId > 0n ? existingCollectionsRes[0] : undefined;

      //We need to fetch all metadata for the collection and badges
      if (collectionId && collectionId > 0n && existingCollection) {
        await collectionsRef.current.fetchAndUpdateMetadata(collectionId, { badgeIds: [{ start: 1n, end: getTotalNumberOfBadges(existingCollection) }] });
      }


      collectionsRef.current.updateCollection({
        //Default values for a new collection
        //If existing, they are overriden
        merkleChallenges: [],
        approvalsTrackers: [],
        managerTimeline: [],
        managerInfo: BLANK_USER_INFO,
        badgeMetadata: [
          {
            metadata: DefaultPlaceholderMetadata,
            badgeIds: [{ start: 1n, end: 10000000000000n }],
            uri: 'Placeholder',
          }],
        collectionMetadata: DefaultPlaceholderMetadata,

        activity: [],
        announcements: [],
        reviews: [],
        owners: [{
          _id: "0:Total",
          collectionId: 0n,
          onChain: true,
          cosmosAddress: 'Total',
          balances: [],
          approvedIncomingTransfersTimeline: [],
          approvedOutgoingTransfersTimeline: [],
          userPermissions: {
            canUpdateApprovedIncomingTransfers: [],
            canUpdateApprovedOutgoingTransfers: [],
          },
        }, {
          _id: "0:Mint",
          cosmosAddress: 'Mint',
          onChain: true,
          collectionId: 0n,
          balances: [],
          approvedIncomingTransfersTimeline: [],
          approvedOutgoingTransfersTimeline: [],
          userPermissions: {
            canUpdateApprovedIncomingTransfers: [],
            canUpdateApprovedOutgoingTransfers: [],
          },
        }],
        views: {},
        collectionApprovedTransfersTimeline: [],
        badgeMetadataTimeline: [],
        standardsTimeline: [],
        offChainBalancesMetadataTimeline: [],
        balancesType: "Standard",
        collectionMetadataTimeline: [],
        inheritedBalancesTimeline: [],
        isArchivedTimeline: [],
        contractAddressTimeline: [],
        customDataTimeline: [],
        collectionPermissions: {
          canArchiveCollection: [],
          canCreateMoreBadges: [],
          canDeleteCollection: [],
          canUpdateBadgeMetadata: [],
          canUpdateCollectionApprovedTransfers: [],
          canUpdateCollectionMetadata: [],
          canUpdateContractAddress: [],
          canUpdateCustomData: [],
          canUpdateInheritedBalances: [],
          canUpdateManager: [],
          canUpdateOffChainBalancesMetadata: [],
          canUpdateStandards: [],
        },
        defaultUserApprovedIncomingTransfersTimeline: [],
        defaultUserApprovedOutgoingTransfersTimeline: [],
        defaultUserPermissions: {
          canUpdateApprovedIncomingTransfers: [],
          canUpdateApprovedOutgoingTransfers: [],
        },
        createdBy: '',
        createdBlock: 0n,

        //Existing collection values
        ...existingCollection,

        //Preview / simulated collection values
        _id: "0",
        collectionId: 0n
      }, true);
      setInitialLoad(true);
    }
    initialize();
  }, [collectionId, txType]);

  //TODO: Reintroduce transfers / claims
  useEffect(() => {
    //We have three things that can affect the new simulated collection:
    //1. If claims change, we need to update the unminted supplys and respective claims field
    //2. If transfers change, we need to update the unminted supplys and respective transfers field
    //3. If badgesToCreate change, we need to update the maxSupplys and unminted supplys field
    //All other updates are handled within CollectionContext
    //Here, we update the preview collection whenever claims, transfers, or badgesToCreate changes

    //TODO: handle balance docs here as well for transfers. For now, we just say unsupported balances. Will need to fetch all existing balances and then update the balances doc with the new balances

    const existingCollection = collectionId ? collectionsRef.current.collections[collectionId.toString()] : undefined;
    const simulatedCollection = collectionsRef.current.collections[0n.toString()];
    if (!simulatedCollection) return;

    //TODO: Is this right? Is remove duplicate logic right?
    //Combine the claims arrays. This is because the fetches may be out of sync between the two
    //Filter out any new claims to be added because those get added in simulateCollectionAfterMsg
    const combinedClaims = [...(existingCollection?.merkleChallenges || []), ...simulatedCollection.merkleChallenges]
      //Remove duplicates  
      .filter(claim => {
        return !simulatedCollection.merkleChallenges.some(claim2 => JSON.stringify(claim) === JSON.stringify(claim2));
      });


    //TODO: Do with approvals trackers too? With balance docs?
    console.log(existingCollection?.owners, badgesToCreate);
    const newOwnersArr = incrementMintAndTotalBalances(0n, existingCollection?.owners ?? [], badgesToCreate);
    console.log(newOwnersArr);

    //If we have created any new badges since the last iteration, add placeholder metadata
    //Else, if we have deleted any badges since the last iteration, remove the corresponding metadata;

    const postSimulatedCollection = { ...simulatedCollection, owners: newOwnersArr, merkleChallenges: combinedClaims };

    let newBadgeMetadata = simulatedCollection.badgeMetadata;
    if (getTotalNumberOfBadges(postSimulatedCollection) > getTotalNumberOfBadges(simulatedCollection)) {
      newBadgeMetadata = updateBadgeMetadata(newBadgeMetadata, {
        metadata: DefaultPlaceholderMetadata,
        badgeIds: [{
          start: getTotalNumberOfBadges(simulatedCollection) + 1n,
          end: getTotalNumberOfBadges(postSimulatedCollection)
        }],
        toUpdate: true,
      });
    } else if (getTotalNumberOfBadges(postSimulatedCollection) < getTotalNumberOfBadges(simulatedCollection)) {
      newBadgeMetadata = removeBadgeMetadata(newBadgeMetadata, [{
        start: getTotalNumberOfBadges(postSimulatedCollection) + 1n,
        end: getTotalNumberOfBadges(simulatedCollection)
      }]);
    }

    postSimulatedCollection.badgeMetadata = newBadgeMetadata;

    console.log(postSimulatedCollection);

    collectionsRef.current.updateCollection(postSimulatedCollection, true);
  }, [collectionId, badgesToCreate]);

  //The method used to add metadata to the collection and individual badges
  const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.None);

  //The distribution method of the badges (claim by codes, manual transfers, whitelist, etc)
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);

  //We use this to keep track of which permissions we have handled so we can properly disable the next buttons
  const [handledPermissions, setHandledPermissions] = useState<CollectionPermissions<bigint>>({
    canArchiveCollection: [],
    canCreateMoreBadges: [],
    canDeleteCollection: [],
    canUpdateBadgeMetadata: [],
    canUpdateCollectionApprovedTransfers: [],
    canUpdateCollectionMetadata: [],
    canUpdateContractAddress: [],
    canUpdateCustomData: [],
    canUpdateInheritedBalances: [],
    canUpdateManager: [],
    canUpdateOffChainBalancesMetadata: [],
    canUpdateStandards: [],
  });

  //Upon any new metadata that will need to be added, we need to update the size of the metadata
  //TODO: Make consistent with actual uploads
  useEffect(() => {
    const newBadgeMetadata = simulatedCollection?.badgeMetadata.filter(x => existingCollection?.badgeMetadata.some(y => JSON.stringify(x) === JSON.stringify(y)) === false);
    const newCollectionMetadata = JSON.stringify(simulatedCollection?.collectionMetadata) !== JSON.stringify(existingCollection?.collectionMetadata) ? simulatedCollection?.collectionMetadata : undefined;

    setSize(Buffer.from(JSON.stringify({ newBadgeMetadata, newCollectionMetadata })).length);
  }, [simulatedCollection, existingCollection]);

  const txTimelineProps = {
    txType,
    addMethod,
    setAddMethod,
    distributionMethod,
    setDistributionMethod,
    handledPermissions,
    setHandledPermissions,
    metadataSize: size,
    existingCollectionId: collectionId,

    transfers,
    setTransfers,
    badgesToCreate,
    setBadgesToCreate,
    onFinish,

    //Update flags
    updateCollectionPermissions,
    setUpdateCollectionPermissions,
    updateManagerTimeline,
    setUpdateManagerTimeline,
    updateCollectionMetadataTimeline,
    setUpdateCollectionMetadataTimeline,
    updateBadgeMetadataTimeline,
    setUpdateBadgeMetadataTimeline,
    updateOffChainBalancesMetadataTimeline,
    setUpdateOffChainBalancesMetadataTimeline,
    updateCustomDataTimeline,
    setUpdateCustomDataTimeline,
    updateInheritedBalancesTimeline,
    setUpdateInheritedBalancesTimeline,
    updateCollectionApprovedTransfersTimeline,
    setUpdateCollectionApprovedTransfersTimeline,
    updateStandardsTimeline,
    setUpdateStandardsTimeline,
    updateContractAddressTimeline,
    setUpdateContractAddressTimeline,
    updateIsArchivedTimeline,
    setUpdateIsArchivedTimeline,
  }

  if (!initialLoad) return <div>
    <Spin size='large' />
    <Divider />
    <h1>Loading...</h1>
    {<p>Fetching all existing details for this collection. This may take some time.</p>}
  </div>

  if (txType === 'UpdateCollection') {
    return <UpdateCollectionTimeline txTimelineProps={txTimelineProps as MsgUpdateCollectionProps} isModal={isModal ? true : false} />
  } else {
    return <></>
  }
}
