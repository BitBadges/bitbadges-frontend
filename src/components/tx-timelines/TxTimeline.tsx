import { BadgeSupplyAndAmount } from 'bitbadgesjs-proto';
import { BLANK_USER_INFO, ClaimInfoWithDetails, DefaultPlaceholderMetadata, DistributionMethod, GetPermissionNumberValue, GetPermissions, MetadataAddMethod, NumberType, Permissions, TransferWithIncrements, UpdatePermissions, removeBadgeMetadata, simulateCollectionAfterMsg, updateBadgeMetadata } from 'bitbadgesjs-utils';
import { useEffect, useRef, useState } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { AddBadgesTimeline } from './AddBadgesTimeline';
import { DistributeTimeline } from './DistributeUnmintedTimeline';
import { MintCollectionTimeline } from './NewCollectionTimeline';
import { UpdateAllowedTimeline } from './UpdateAllowedTimeline';
import { UpdateMetadataTimeline } from './UpdateMetadataTimeline';
import { UpdateUserBalancesTimeline } from './UpdateOffChainBalancesTimeline';
import { Spin } from 'antd';

export const EmptyStepItem = {
  title: '',
  description: '',
  node: <></>,
  doNotDisplay: true,
}

export const MSG_PREVIEW_ID = 0n;

//For the MsgNewCollection, MsgMintAndDistributeBadges, MsgUpdateUris, and MsgUpdateallowedTransfers transactions, we use this TxTimeline component. 
//We use the txType prop to determine which timeline compoennt to use.
//Each timeline makes use of the necessary, reusable components in the step-items and form-items folders.
//The step-items are the individual steps in the timeline, and the form-items are the helper components that are displayed in each step.
//We convert the Msg to the appropriate transaction type at the end.

//NewCollection: Creates a new badge collection
//UpdateMetadata: Updates the metadata URIs of a badge collection
//UpdateAllowed: Updates the allowed transfers of a badge collection
//DistributeBadges: Distributes the unminted badges of a badge collection
//AddBadges: Adds new badges to a badge collection

/*
  IMPORTANT FOR DEVELOPERS: Read below
  
  Do not update any of the existingCollection or collectionsContext.getCollection(existingCollectionId) fields.
  Instead, use the simulated collection with ID === 0n aka ID === MSG_PREVIEW_ID. 
  The simulated collection is a copy of the existing collection with the changes specified by the Msg applied to it.
  This is because we want to be able to simulate the changes to the collection without actually updating the collection.

  For any new claims, transfers, and badgeSupplys to be added, we export the claims, transfers, and badgeSupplys fields in the TxTimelineProps.
  We will handle all logic for updating the simulated collection automatically in this file with the changes specified by these fields
  such as updating the unminted supplys, max supplys, nextBadgeId, nextClaimId, and claims fields of the simulated collection.

  DO NOT UPDATE ANY OF THE FOLLOWING OF THE SIMULATED COLLECTION'S FIELDS DIRECTLY VIA THE CONTEXT. 
  -claims, nextBadgeId, nextClaimId, unmintedSupplys, maxSupplys

  USE THE PROVIDED CLAIMS, TRANSFERS, AND BADGESUPPLYS FIELDS AND THEIR SETTER METHODS INSTEAD.
*/

export interface CreateAndDistributeMsg<T extends NumberType> {
  claims: (ClaimInfoWithDetails<T> & { password: string, codes: string[] })[]
  setClaims: (claims: (ClaimInfoWithDetails<T> & { password: string, codes: string[] })[]) => void
  transfers: TransferWithIncrements<T>[]
  setTransfers: (transfers: TransferWithIncrements<T>[]) => void
  badgeSupplys: BadgeSupplyAndAmount<T>[];
  setBadgeSupplys: (badgeSupplys: BadgeSupplyAndAmount<T>[]) => void

  //TODO: abstract this better so we can have multiple distribution methods for different transfers
  distributionMethod: DistributionMethod
  setDistributionMethod: (method: DistributionMethod) => void
}


export interface NewCollection {
  handledPermissions: Permissions
  updatePermissions: (digit: number, value: boolean) => void
}

export interface UpdateMetadataMsg {
  addMethod: MetadataAddMethod
  setAddMethod: (method: MetadataAddMethod) => void
  metadataSize: number
}

export type MsgNewCollectionProps = BaseTxTimelineProps & NewCollection & CreateAndDistributeMsg<bigint> & UpdateMetadataMsg & { onFinish: (props: BaseTxTimelineProps & NewCollection & CreateAndDistributeMsg<bigint> & UpdateMetadataMsg) => void };
export type MsgMintAndDistriubteBadgesProps = BaseTxTimelineProps & CreateAndDistributeMsg<bigint> & UpdateMetadataMsg & { onFinish: (props: BaseTxTimelineProps & CreateAndDistributeMsg<bigint> & UpdateMetadataMsg) => void };
export type MsgUpdateUrisProps = BaseTxTimelineProps & UpdateMetadataMsg & { onFinish: (props: BaseTxTimelineProps & UpdateMetadataMsg) => void };
export type MsgUpdateAllowedProps = BaseTxTimelineProps & NewCollection & { onFinish: (props: BaseTxTimelineProps & NewCollection) => void };
export type MsgUpdateBalancesProps = BaseTxTimelineProps & CreateAndDistributeMsg<bigint> & { onFinish: (props: BaseTxTimelineProps & CreateAndDistributeMsg<bigint>) => void };


export interface BaseTxTimelineProps {
  txType: 'NewCollection' | 'UpdateMetadata' | 'UpdateAllowed' | 'DistributeBadges' | 'AddBadges' | 'UpdateBalances'

  existingCollectionId?: bigint
  onFinish?: ((props: MsgNewCollectionProps) => void) | ((props: MsgMintAndDistriubteBadgesProps) => void) | ((props: MsgUpdateUrisProps) => void) | ((props: MsgUpdateAllowedProps) => void) | ((props: MsgUpdateBalancesProps) => void)
}

export function TxTimeline({
  txType,
  collectionId,
  onFinish,
}: {
  txType: 'NewCollection' | 'UpdateMetadata' | 'UpdateAllowed' | 'DistributeBadges' | 'AddBadges' | 'UpdateBalances'
  collectionId?: bigint,
  onFinish?: ((props: MsgNewCollectionProps) => void) | ((props: MsgMintAndDistriubteBadgesProps) => void) | ((props: MsgUpdateUrisProps) => void) | ((props: MsgUpdateAllowedProps) => void) | ((props: MsgUpdateBalancesProps) => void)
}) {
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);

  const existingCollection = collectionId ? collections.getCollection(collectionId) : undefined;
  const simulatedCollection = collections.getCollection(MSG_PREVIEW_ID);

  const [size, setSize] = useState(0);
  const [claims, setClaims] = useState<(ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[]>([]);
  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [badgeSupplys, setBadgeSupplys] = useState<BadgeSupplyAndAmount<bigint>[]>([]);
  const [initialLoad, setInitialLoad] = useState(false);

  //Only upon first load, we fetch the collection from the server if it exists
  //Set default values for the collection if it doesn't exist or populate with exsitng values if it does
  //Throughout the timeline, we never update the existing collection, only the simulated collection with ID === 0n
  useEffect(() => {
    async function initialize() {
      const existingCollection = collectionId ? await collectionsRef.current.fetchCollections([collectionId]) : undefined;

      collectionsRef.current.updateCollection({
        //Default values
        claims: [],
        manager: '',
        managerInfo: BLANK_USER_INFO,
        badgeMetadata: [
          {
            metadata: DefaultPlaceholderMetadata,
            badgeIds: [{ start: 1n, end: 10000000000000n }],
            uri: 'Placeholder',
          }],
        collectionMetadata: DefaultPlaceholderMetadata,
        nextBadgeId: 1n,
        maxSupplys: [],
        balancesUri: '',
        permissions: {
          CanCreateMoreBadges: true,
          CanManagerBeTransferred: true,
          CanUpdateAllowed: true,
          CanUpdateMetadataUris: true,
          CanUpdateBytes: true,
          CanDelete: true,
          CanUpdateBalancesUri: true,
        },
        activity: [],
        announcements: [],
        reviews: [],
        badgeUris: [],
        owners: [],
        views: {},
        collectionUri: '',
        bytes: '',
        allowedTransfers: [],
        managerApprovedTransfers: [],
        managerRequests: [],
        nextClaimId: 1n,
        unmintedSupplys: [],
        standard: 0n,
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
  }, [collectionId]);

  useEffect(() => {
    //We have three things that can affect the new simulated collection:
    //1. If claims change, we need to update the unminted supplys and respective claims field
    //2. If transfers change, we need to update the unminted supplys and respective transfers field
    //3. If badgeSupplys change, we need to update the maxSupplys and unminted supplys field
    //All other updates are handled within CollectionContext
    //Here, we update the preview collection whenever claims, transfers, or badgeSupplys changes

    //TODO: handle balance docs here as well for transfers. For now, we just say unsupported balances. Will need to fetch all existing balances 
    //and then update the balances doc with the new balances

    const existingCollection = collectionId ? collectionsRef.current.getCollection(collectionId) : undefined;
    const simulatedCollection = collectionsRef.current.getCollection(0n);
    if (!simulatedCollection) return;

    //Combine the claims arrays. This is because the fetches may be out of sync between the two
    //Filter out any new claims to be added because those get added in simulateCollectionAfterMsg
    const combinedClaims = [...(existingCollection?.claims || []), ...simulatedCollection.claims]
      //Remove duplicates  
      .filter(claim => {
        return !simulatedCollection.claims.some(claim2 => claim2.claimId === claim.claimId) && claim.claimId < simulatedCollection.nextClaimId;
      });

    const postSimulatedCollection = simulateCollectionAfterMsg({
      ...simulatedCollection, //These fields do not matter and are ignored. Just for TS. Simularly, we should not read from these fields from postSimulatedCollection
      claims: combinedClaims,
      unmintedSupplys: existingCollection?.unmintedSupplys ? existingCollection.unmintedSupplys : [],
      maxSupplys: existingCollection?.maxSupplys ? existingCollection.maxSupplys : [],
      nextBadgeId: existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1n,
      nextClaimId: existingCollection?.nextClaimId ? existingCollection.nextClaimId : 1n,
    }, claims, transfers, badgeSupplys);

    //If we have created any new badges since the last iteration, add placeholder metadata
    //Else, if we have deleted any badges since the last iteration, remove the metadata
    let newBadgeMetadata = simulatedCollection.badgeMetadata;
    if (postSimulatedCollection.nextBadgeId > simulatedCollection.nextBadgeId) {
      newBadgeMetadata = updateBadgeMetadata(newBadgeMetadata, {
        metadata: DefaultPlaceholderMetadata,
        badgeIds: [{
          start: simulatedCollection.nextBadgeId,
          end: postSimulatedCollection.nextBadgeId - 1n
        }]
      });
    } else if (postSimulatedCollection.nextBadgeId < simulatedCollection.nextBadgeId) {
      newBadgeMetadata = removeBadgeMetadata(newBadgeMetadata, [{
        start: postSimulatedCollection.nextBadgeId,
        end: simulatedCollection.nextBadgeId - 1n
      }]);
    }

    collectionsRef.current.updateCollection({
      ...simulatedCollection,
      unmintedSupplys: postSimulatedCollection.unmintedSupplys,
      claims: postSimulatedCollection.claims,
      maxSupplys: postSimulatedCollection.maxSupplys,
      nextBadgeId: postSimulatedCollection.nextBadgeId,
      nextClaimId: postSimulatedCollection.nextClaimId,
      badgeMetadata: newBadgeMetadata,
    }, true);
  }, [collectionId, claims, transfers, badgeSupplys]);

  //The method used to add metadata to the collection and individual badges
  const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.None);

  //The distribution method of the badges (claim by codes, manual transfers, whitelist, etc)
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);

  //We use this to keep track of which permissions we have handled so we can properly disable the next buttons
  const [handledPermissions, setHandledPermissions] = useState<Permissions>({
    CanCreateMoreBadges: false,
    CanManagerBeTransferred: false,
    CanUpdateAllowed: false,
    CanUpdateMetadataUris: false,
    CanUpdateBytes: false,
    CanDelete: false,
    CanUpdateBalancesUri: false,
  });

  const updatePermissions = (digit: number, value: boolean) => {
    if (!simulatedCollection) return;

    const currPermissions = GetPermissionNumberValue(simulatedCollection.permissions);
    const newPermissions = UpdatePermissions(currPermissions, digit, value);

    collections.updateCollection({
      ...simulatedCollection,
      permissions: GetPermissions(newPermissions),
    });

    //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
    let handledPermissionsAsNumber = GetPermissionNumberValue(handledPermissions);
    let newHandledPermissionsNumber = UpdatePermissions(handledPermissionsAsNumber, digit, true);
    let newHandledPermissions = GetPermissions(newHandledPermissionsNumber);
    setHandledPermissions({ ...newHandledPermissions });

    return newPermissions;
  }

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
    updatePermissions,
    metadataSize: size,
    existingCollectionId: collectionId,

    claims,
    setClaims,
    transfers,
    setTransfers,
    badgeSupplys,
    setBadgeSupplys,
    onFinish,
  }

  if (!initialLoad) return <Spin size='large' />;

  if (txType === 'NewCollection') {
    return <MintCollectionTimeline txTimelineProps={txTimelineProps as MsgNewCollectionProps} />
  }

  if (!existingCollection) return <></>;

  if (txType === 'UpdateMetadata') {
    return <UpdateMetadataTimeline txTimelineProps={txTimelineProps as MsgUpdateUrisProps} />
  } else if (txType === 'UpdateAllowed') {
    return <UpdateAllowedTimeline txTimelineProps={txTimelineProps as MsgUpdateAllowedProps} />
  } else if (txType === 'DistributeBadges') {
    return <DistributeTimeline txTimelineProps={txTimelineProps as MsgMintAndDistriubteBadgesProps} />
  } else if (txType === 'AddBadges') {
    return <AddBadgesTimeline txTimelineProps={txTimelineProps as MsgMintAndDistriubteBadgesProps} />
  } else if (txType === 'UpdateBalances') {
    return <UpdateUserBalancesTimeline txTimelineProps={txTimelineProps as MsgUpdateBalancesProps} />
  } else {
    return <></>
  }
}
