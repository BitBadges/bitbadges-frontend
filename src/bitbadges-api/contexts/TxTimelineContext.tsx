import { AddressMapping, Balance, deepCopy } from 'bitbadgesjs-proto';
import { BitBadgesCollection, CollectionApprovedTransferWithDetails, DefaultPlaceholderMetadata, DistributionMethod, MetadataAddMethod, NumberType, TransferWithIncrements, incrementMintAndTotalBalances, removeBadgeMetadata, updateBadgeMetadata } from 'bitbadgesjs-utils';
import { createContext, useContext, useEffect, useState } from 'react';
import { MintType } from '../../components/tx-timelines/step-items/ChooseBadgeTypeStepItem';
import { INFINITE_LOOP_MODE } from '../../constants';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { getAddressMappings } from '../api';
import { getTotalNumberOfBadges } from '../utils/badges';
import { getMintApprovedTransfers, getNonMintApprovedTransfers } from '../utils/mintVsNonMint';
import { useAccountsContext } from './AccountsContext';
import { useChainContext } from './ChainContext';
import { useCollectionsContext } from './CollectionsContext';


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
  This is because we want to be able to simulate the changes to the collection and access them without actually updating the existing collection in the cache.

  Minor hacks applied:
  -badgesToCreate is exported in TxTimelineProps, and we automatically update "Mint" and "Total" balances to reflect the new total and mint balances
  -merkleChallenges are handled via the collectionApprovedTransfers field of the collections from the collections context. Here, there is an extra field called details
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

  mintType: MintType
  setMintType: (mintType: MintType) => void
}

export interface CreateAddressMappingMsg {
  addressMapping: AddressMapping
  setAddressMapping: (addressMapping: AddressMapping) => void
  isUpdateAddressMapping?: boolean
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
  updateCollectionApprovedTransfers: boolean;
  setUpdateCollectionApprovedTransfers: (value: boolean) => void;
  updateStandardsTimeline: boolean;
  setUpdateStandardsTimeline: (value: boolean) => void;
  updateContractAddressTimeline: boolean;
  setUpdateContractAddressTimeline: (value: boolean) => void;
  updateIsArchivedTimeline: boolean;
  setUpdateIsArchivedTimeline: (value: boolean) => void;
}

export type MsgUpdateCollectionProps = CreateAndDistributeMsg<bigint> & CreateAddressMappingMsg & UpdateMetadataMsg & UpdateFlags & BaseTxTimelineProps

export interface BaseTxTimelineProps {
  txType: 'UpdateCollection'
  existingCollectionId: bigint | undefined
  setExistingCollectionId: (existingCollectionId: bigint | undefined) => void

  startingCollection: BitBadgesCollection<bigint> | undefined
  setStartingCollection: (startingCollection: BitBadgesCollection<bigint> | undefined) => void

  initialLoad: boolean
  setInitialLoad: (initialLoad: boolean) => void

  existingAddressMappingId: string
  setExistingAddressMappingId: (addressMappingId: string) => void

  formStepNum: number
  setFormStepNum: (formStepNum: number) => void

  resetState: () => void

  completeControl: boolean
  setCompleteControl: (completeControl: boolean) => void

  approvedTransfersToAdd: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]
  setApprovedTransfersToAdd: (approvedTransfersToAdd: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]) => void
  resetApprovedTransfersToAdd: () => (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]
}

export type TxTimelineContextType = MsgUpdateCollectionProps;

const TxTimelineContext = createContext<TxTimelineContextType>({
  txType: 'UpdateCollection',
  existingCollectionId: undefined,
  setExistingCollectionId: () => { },

  approvedTransfersToAdd: [],
  setApprovedTransfersToAdd: () => { },

  startingCollection: undefined,
  setStartingCollection: () => { },

  existingAddressMappingId: '',
  setExistingAddressMappingId: () => { },

  transfers: [],
  setTransfers: () => { },
  badgesToCreate: [],
  setBadgesToCreate: () => { },

  //Update flags
  updateCollectionPermissions: true,
  setUpdateCollectionPermissions: () => { },
  updateManagerTimeline: true,
  setUpdateManagerTimeline: () => { },
  updateCollectionMetadataTimeline: true,
  setUpdateCollectionMetadataTimeline: () => { },
  updateBadgeMetadataTimeline: true,
  setUpdateBadgeMetadataTimeline: () => { },
  updateOffChainBalancesMetadataTimeline: true,
  setUpdateOffChainBalancesMetadataTimeline: () => { },
  updateCustomDataTimeline: true,
  setUpdateCustomDataTimeline: () => { },
  updateCollectionApprovedTransfers: true,
  setUpdateCollectionApprovedTransfers: () => { },
  updateStandardsTimeline: true,
  setUpdateStandardsTimeline: () => { },
  updateContractAddressTimeline: true,
  setUpdateContractAddressTimeline: () => { },
  updateIsArchivedTimeline: true,
  setUpdateIsArchivedTimeline: () => { },

  mintType: MintType.BitBadge,
  setMintType: () => { },

  addressMapping: {
    mappingId: '',
    addresses: [],
    includeAddresses: true,
    uri: '',
    customData: '',

    createdBy: '',
  },
  setAddressMapping: () => { },

  addMethod: MetadataAddMethod.None,
  setAddMethod: () => { },
  distributionMethod: DistributionMethod.None,
  setDistributionMethod: () => { },
  metadataSize: 0,
  initialLoad: true,
  setInitialLoad: () => { },
  formStepNum: 1,
  setFormStepNum: () => { },
  resetState: () => { },

  completeControl: false,
  setCompleteControl: () => { },
  resetApprovedTransfersToAdd: () => []
});

type Props = {
  children?: React.ReactNode
};
export const TxTimelineContextProvider: React.FC<Props> = ({ children }) => {
  const collections = useCollectionsContext();
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const txType = 'UpdateCollection';

  const [existingCollectionId, setExistingCollectionId] = useState<bigint>();
  const [existingAddressMappingId, setExistingAddressMappingId] = useState<string>('');
  const [formStepNum, setFormStepNum] = useState(1);

  const [startingCollection, setStartingCollection] = useState<BitBadgesCollection<bigint>>();
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;
  const simulatedCollection = collections.collections[MSG_PREVIEW_ID.toString()];

  const [size, setSize] = useState(0);
  const [badgesToCreate, setBadgesToCreate] = useState<Balance<bigint>[]>([]);
  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [initialLoad, setInitialLoad] = useState(false);
  const [completeControl, setCompleteControl] = useState(false);

  const [mintType, setMintType] = useState<MintType>(MintType.BitBadge);

  const [addressMapping, setAddressMapping] = useState<AddressMapping>({
    mappingId: '',
    addresses: [],
    includeAddresses: true,
    uri: '',
    customData: '',
    createdBy: chain.address
  })

  //The method used to add metadata to the collection and individual badges
  const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.None);

  //The distribution method of the badges (claim by codes, manual transfers, whitelist, etc)
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);


  //Update flags
  const [updateCollectionPermissions, setUpdateCollectionPermissions] = useState(true);
  const [updateManagerTimeline, setUpdateManagerTimeline] = useState(true);
  const [updateCollectionMetadataTimeline, setUpdateCollectionMetadataTimeline] = useState(true);
  const [updateBadgeMetadataTimeline, setUpdateBadgeMetadataTimeline] = useState(true);
  const [updateOffChainBalancesMetadataTimeline, setUpdateOffChainBalancesMetadataTimeline] = useState(true);
  const [updateCustomDataTimeline, setUpdateCustomDataTimeline] = useState(true);
  const [updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers] = useState(true);
  const [updateStandardsTimeline, setUpdateStandardsTimeline] = useState(true);
  const [updateContractAddressTimeline, setUpdateContractAddressTimeline] = useState(true);
  const [updateIsArchivedTimeline, setUpdateIsArchivedTimeline] = useState(true);

  const [approvedTransfersToAdd, setApprovedTransfersToAdd] = useState<(CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]>(
    startingCollection ? getMintApprovedTransfers(startingCollection).map(x => {
      return {
        ...x,
        balances: [{
          //TODO: We should get rid of balances here
          badgeIds: x.badgeIds,
          ownershipTimes: x.ownershipTimes,
          amount: 1n //will not matter
        }]
      }
    }) : []
  );

  useEffect(() => {
    resetApprovedTransfersToAdd();

  }, [startingCollection]);

  const resetApprovedTransfersToAdd = () => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: update collection timeline, existing collection changed');
    if (!startingCollection) return [];

    //Slot it right in the middle [existing "Mint", toAdd, non-"Mint"]
    const existingFromMint = getMintApprovedTransfers(startingCollection);
    const defaultApprovedTransfersToAdd = existingFromMint.map(x => {
      return {
        ...x,
        balances: [{
          //TODO: We should get rid of balances here
          badgeIds: x.badgeIds,
          ownershipTimes: x.ownershipTimes,
          amount: 1n //will not matter
        }]
      }
    })

    setApprovedTransfersToAdd(defaultApprovedTransfersToAdd);

    return deepCopy(defaultApprovedTransfersToAdd);
  }
  //This is the main useEffect where we update the collection with the new approved transfers

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: create claims, approved transfers to add changed');
    if (!simulatedCollection || distributionMethod === DistributionMethod.OffChainBalances) return;

    const existingNonMint = getNonMintApprovedTransfers(simulatedCollection, true);

    collections.updateCollection({
      ...simulatedCollection,
      collectionApprovedTransfers: [
        // ...existingFromMint, //We included in approvedTransfersToAdd 
        ...approvedTransfersToAdd, ...existingNonMint],
    });
  }, [approvedTransfersToAdd, distributionMethod]);




  function resetState() {
    setExistingCollectionId(undefined);
    setStartingCollection(undefined);
    setExistingAddressMappingId('');
    setFormStepNum(1);
    setBadgesToCreate([]);
    setTransfers([]);
    setInitialLoad(false);
    setMintType(MintType.BitBadge);
    setAddressMapping({
      mappingId: '',
      addresses: [],
      includeAddresses: true,
      uri: '',
      customData: '',
      createdBy: chain.address
    })
    setSize(0);

    setUpdateCollectionPermissions(true);
    setUpdateManagerTimeline(true);
    setUpdateCollectionMetadataTimeline(true);
    setUpdateBadgeMetadataTimeline(true);
    setUpdateOffChainBalancesMetadataTimeline(true);
    setUpdateCustomDataTimeline(true);
    setUpdateCollectionApprovedTransfers(true);
    setUpdateStandardsTimeline(true);
    setUpdateContractAddressTimeline(true);
    setUpdateIsArchivedTimeline(true);
    setDistributionMethod(DistributionMethod.None);

    setCompleteControl(false);
    resetApprovedTransfersToAdd();
  }

  //Initial fetch of the address mapping we are updating if it exists
  useEffect(() => {
    async function getAddressMapping() {
      if (INFINITE_LOOP_MODE) console.log('useEffect: address mapping, initial load');
      if (!existingAddressMappingId) return;
      setMintType(MintType.AddressList);
      const res = await getAddressMappings({ mappingIds: [existingAddressMappingId] });
      if (res) {
        setAddressMapping(res.addressMappings[0]);
      }
    }
    getAddressMapping();
  }, [existingAddressMappingId]);

  //Only upon first load, we fetch the existing collection from the server if it exists
  //Set default values for the collection if it doesn't exist or populate with exsitng values if it does
  //Throughout the timeline, we never update the existing collection, only the simulated collection with ID === 0n
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: inital load ');
    async function initialize() {

      setInitialLoad(false);

      const existingCollectionsRes = existingCollectionId && existingCollectionId > 0n ? await collections.fetchCollectionsWithOptions(
        [{
          collectionId: existingCollectionId, viewsToFetch: [],
          fetchTotalAndMintBalances: true,
          handleAllAndAppendDefaults: false,
        }], true) : [];
      let existingCollection = existingCollectionId && existingCollectionId > 0n ? existingCollectionsRes[0] : undefined;

      if (existingCollectionId && existingCollectionId > 0n && existingCollection) {
        await accounts.fetchAccounts([existingCollection.createdBy, ...existingCollection.managerTimeline.map(x => x.manager)]);
      }

      const startingCollection: BitBadgesCollection<bigint> = {
        //Default values for a new collection
        //If existing, they are overriden further below via the spread
        merkleChallenges: [],
        approvalsTrackers: [],
        updateHistory: [],
        managerTimeline: [{
          manager: chain.cosmosAddress,
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        }],
        cachedBadgeMetadata: [
          {
            metadata: DefaultPlaceholderMetadata,
            badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
            toUpdate: true,
          }],
        cachedCollectionMetadata: DefaultPlaceholderMetadata,

        activity: [],
        announcements: [],
        reviews: [],
        owners: [{
          _id: "0:Total",
          collectionId: 0n,
          onChain: true,
          cosmosAddress: 'Total',
          balances: [],
          approvedIncomingTransfers: [],
          approvedOutgoingTransfers: [],
          userPermissions: {
            canUpdateApprovedIncomingTransfers: [],
            canUpdateApprovedOutgoingTransfers: [],
          },
          updateHistory: [],
        }, {
          _id: "0:Mint",
          cosmosAddress: 'Mint',
          onChain: true,
          collectionId: 0n,
          balances: [],
          approvedIncomingTransfers: [],
          approvedOutgoingTransfers: [],
          userPermissions: {
            canUpdateApprovedIncomingTransfers: [],
            canUpdateApprovedOutgoingTransfers: [],
          },
          updateHistory: [],
        }],
        views: {},
        collectionApprovedTransfers: [],
        badgeMetadataTimeline: [],
        // standardsTimeline: [{
        //   standards: ["BitBadges"],
        //   timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        // }], TODO:
        standardsTimeline: [],
        balancesType: "Standard",
        collectionMetadataTimeline: [],

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
          canUpdateManager: [],
          canUpdateOffChainBalancesMetadata: [],
          canUpdateStandards: [],
        },
        defaultUserApprovedIncomingTransfers: [],
        defaultUserApprovedOutgoingTransfers: [],
        defaultUserPermissions: {
          canUpdateApprovedIncomingTransfers: [],
          canUpdateApprovedOutgoingTransfers: [],
        },
        createdBy: '',
        createdBlock: 0n,
        createdTimestamp: 0n,

        //Existing collection values
        ...existingCollection,
        offChainBalancesMetadataTimeline: existingCollection && existingCollection.offChainBalancesMetadataTimeline
          && existingCollection.balancesType === "Off-Chain"
          ? existingCollection.offChainBalancesMetadataTimeline : [],

        //Preview / simulated collection values
        _id: "0",
        collectionId: 0n
      }

      setStartingCollection(deepCopy(startingCollection));
      collections.updateCollection(startingCollection, true);


      setInitialLoad(true);
    }
    initialize();
  }, [existingCollectionId, txType]);

  //TODO: Reintroduce transfers / claims?
  //TODO: handle balance docs here as well for transfers? For now, we just say unsupported balances. Will need to fetch all existing balances and then update the balances doc with the new balances
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: update simulation');
    //We have three things that can affect the new simulated collection:
    //1. If claims change, we need to update the unminted supplys and respective claims field
    //2. If transfers change, we need to update the unminted supplys and respective transfers field
    //3. If badgesToCreate change, we need to update the maxSupplys and unminted supplys field
    //All other updates are handled within CollectionContext
    //Here, we update the preview collection whenever claims, transfers, or badgesToCreate changes


    const _existingCollection = startingCollection;
    const _simulatedCollection = collections.collections[MSG_PREVIEW_ID.toString()];
    if (!_simulatedCollection) return;
    if (!initialLoad) return;

    const existingCollection = _existingCollection ? deepCopy(_existingCollection) : undefined;
    const simulatedCollection = deepCopy(_simulatedCollection);

    //TODO: Is this right? Is remove duplicate logic right?
    //Combine the claims arrays. This is because the fetches may be out of sync between the two
    //Filter out any new claims to be added because those get added in simulateCollectionAfterMsg
    const combinedClaims = [...(existingCollection?.merkleChallenges || []), ...simulatedCollection.merkleChallenges]
      //Remove duplicates  
      .filter(claim => {
        return !simulatedCollection.merkleChallenges.some(claim2 => compareObjects(claim, claim2));
      });
    const newOwnersArr = incrementMintAndTotalBalances(0n, existingCollection?.owners ?? [], badgesToCreate);


    //If we have created any new badges since the last iteration, add placeholder metadata
    //Else, if we have deleted any badges since the last iteration, remove the corresponding metadata;

    const postSimulatedCollection = { ...simulatedCollection, owners: newOwnersArr, merkleChallenges: combinedClaims };

    let newBadgeMetadata = simulatedCollection.cachedBadgeMetadata;
    //If we have created any new badges since the last iteration, add placeholder metadata
    //If we have removed any badges since the last iteration, remove the corresponding metadata
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
    console.log("newBadgeMetadata: ", newBadgeMetadata);
    //Append placeholders to end. Note we take first match only so placeholder metadata will only be for badges w/o metadata
    newBadgeMetadata.push({
      badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
      metadata: DefaultPlaceholderMetadata,
      toUpdate: true,
    });

    postSimulatedCollection.cachedBadgeMetadata = newBadgeMetadata;

    collections.updateCollection(postSimulatedCollection, true);
  }, [existingCollectionId, badgesToCreate, initialLoad, collections]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  distribution method');
    if (!simulatedCollection) return;

    if (distributionMethod === DistributionMethod.OffChainBalances) {
      collections.updateCollection({
        ...simulatedCollection,
        balancesType: "Off-Chain",
      });

      setUpdateCollectionApprovedTransfers(false);
    } else {
      setUpdateCollectionApprovedTransfers(true);

      collections.updateCollection({
        ...simulatedCollection,
        balancesType: "Standard",
      }, true);
    }
  }, [distributionMethod]);

  //Upon any new metadata that will need to be added, we need to update the size of the metadata
  //TODO: Make consistent with actual uploads
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: metadata size');
    const newBadgeMetadata = simulatedCollection?.cachedBadgeMetadata.filter(x => existingCollection?.cachedBadgeMetadata.some(y => compareObjects(x, y)) === false);
    const newCollectionMetadata = !compareObjects(simulatedCollection?.cachedCollectionMetadata, existingCollection?.cachedCollectionMetadata) ? simulatedCollection?.cachedCollectionMetadata : undefined;

    setSize(Buffer.from(JSON.stringify({ newBadgeMetadata, newCollectionMetadata })).length);
  }, [simulatedCollection, existingCollection]);

  const context: TxTimelineContextType = {
    resetState,
    txType,
    addMethod,
    setAddMethod,
    distributionMethod,
    setDistributionMethod,
    metadataSize: size,
    existingCollectionId: existingCollectionId,
    startingCollection,
    setStartingCollection,

    resetApprovedTransfersToAdd,

    transfers,
    setTransfers,
    badgesToCreate,
    setBadgesToCreate,

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
    updateCollectionApprovedTransfers,
    setUpdateCollectionApprovedTransfers,
    updateStandardsTimeline,
    setUpdateStandardsTimeline,
    updateContractAddressTimeline,
    setUpdateContractAddressTimeline,
    updateIsArchivedTimeline,
    setUpdateIsArchivedTimeline,
    isUpdateAddressMapping: existingAddressMappingId ? true : false,

    mintType,
    setMintType,
    addressMapping,
    setAddressMapping,

    existingAddressMappingId,
    setExistingAddressMappingId,

    setExistingCollectionId: setExistingCollectionId,
    initialLoad,
    setInitialLoad,

    formStepNum,
    setFormStepNum,

    completeControl,
    setCompleteControl,

    approvedTransfersToAdd,
    setApprovedTransfersToAdd
  }

  return <TxTimelineContext.Provider value={context}>
    {children}
  </TxTimelineContext.Provider>;
}

export const useTxTimelineContext = () => useContext(TxTimelineContext);