import { AddressList, Balance, deepCopy } from 'bitbadgesjs-proto';
import { AddressListEditKey, BitBadgesCollection, CollectionApprovalWithDetails, DefaultPlaceholderMetadata, MetadataAddMethod, NumberType, TransferWithIncrements, incrementMintAndTotalBalances } from 'bitbadgesjs-utils';
import { createContext, useContext, useEffect, useState } from 'react';
import { MintType } from '../../components/tx-timelines/step-items/ChooseBadgeTypeStepItem';
import { defaultApprovedOption } from '../../components/tx-timelines/step-items/DefaultToApprovedSelectStepItem';
import { INFINITE_LOOP_MODE } from '../../constants';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { getAddressLists } from '../api';
import { useChainContext } from './ChainContext';
import { fetchAccounts } from './accounts/AccountsContext';
import { fetchCollectionsWithOptions, setCollection, updateCollection, useCollection } from './collections/CollectionsContext';

export const EmptyStepItem = {
  title: '',
  description: '',
  node: () => <></>,
  doNotDisplay: true,
}

export const NEW_COLLECTION_ID = 0n;

//Each timeline makes use of the necessary, reusable components in the step-items and form-items folders.
//The step-items are the individual steps in the timeline, and the form-items are the helper components that are displayed in each step.

/*
  IMPORTANT FOR DEVELOPERS: Read below
  
  Use the simulated collection with ID === 0n aka ID === NEW_COLLECTION_ID from the collections global store. 

  The simulated collection is a copy of the existing collection with the changes specified by the new-to-be Msg applied to it.
  This is because we want to be able to simulate the changes to the collection and access them without actually updating the existing collection in the cache.

  Minor hacks applied:
  -badgesToCreate is exported in TxTimelineProps, and we automatically update "Mint" and "Total" balances to reflect the new total and mint balances via the useEffect
  -merkleChallenges are handled via the collectionApprovals field of the collections from the collections context. Here, there is an extra field called details
    which specifies extra details about the merkle challenge (name, description, password, preimage codes, etc). These are to be uploaded to IPFS but removed before creating the Msg.
  -transfers should only be used for off-chain balances

  DO NOT UPDATE THE MINT OR TRANSFER BALANCES DIRECTLY. Use badgesToCreate instead.
*/

export interface CreateAndDistributeMsg<T extends NumberType> {
  transfers: TransferWithIncrements<T>[]
  setTransfers: (transfers: TransferWithIncrements<T>[]) => void

  badgesToCreate: Balance<T>[];
  setBadgesToCreate: (badgesToCreate: Balance<T>[]) => void

  mintType: MintType
  setMintType: (mintType: MintType) => void

  customCollection: boolean;
  setCustomCollection: (customCollection: boolean) => void
}

export interface CreateAddressListMsg<T extends NumberType> {
  addressList: (AddressList & {
    private?: boolean;

    editKeys?: AddressListEditKey<T>[];
  })
  setAddressList: (addressList: AddressList & {
    private?: boolean;
    editKeys?: AddressListEditKey<T>[];
  }) => void
  isUpdateAddressList?: boolean
}

export interface UpdateMetadataMsg {
  collectionAddMethod: MetadataAddMethod
  setCollectionAddMethod: (method: MetadataAddMethod) => void

  badgeAddMethod: MetadataAddMethod
  setBadgeAddMethod: (method: MetadataAddMethod) => void

  metadataSize: number

  offChainAddMethod: MetadataAddMethod
  setOffChainAddMethod: (method: MetadataAddMethod) => void
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
  updateCollectionApprovals: boolean;
  setUpdateCollectionApprovals: (value: boolean) => void;
  updateStandardsTimeline: boolean;
  setUpdateStandardsTimeline: (value: boolean) => void;
  updateIsArchivedTimeline: boolean;
  setUpdateIsArchivedTimeline: (value: boolean) => void;
}

export type MsgUniversalUpdateCollectionProps = CreateAndDistributeMsg<bigint> & CreateAddressListMsg<bigint> & UpdateMetadataMsg & UpdateFlags & BaseTxTimelineProps

export interface BaseTxTimelineProps {
  txType: 'UpdateCollection'
  existingCollectionId: bigint | undefined
  setExistingCollectionId: (existingCollectionId: bigint | undefined) => void

  startingCollection: BitBadgesCollection<bigint> | undefined
  setStartingCollection: (startingCollection: BitBadgesCollection<bigint> | undefined) => void

  initialLoad: boolean
  setInitialLoad: (initialLoad: boolean) => void

  existingAddressListId: string
  setExistingAddressListId: (addressListId: string) => void

  formStepNum: number
  setFormStepNum: (formStepNum: number) => void

  resetState: (collectionId?: bigint, addressListId?: string) => void

  completeControl: boolean
  setCompleteControl: (completeControl: boolean) => void

  resetCollectionApprovals: () => (CollectionApprovalWithDetails<bigint>)[]

  showAdvancedOptions: boolean
  setShowAdvancedOptions: (showAdvancedOptions: boolean) => void
}

export type TxTimelineContextType = MsgUniversalUpdateCollectionProps;

const TxTimelineContext = createContext<TxTimelineContextType>({
  txType: 'UpdateCollection',
  existingCollectionId: undefined,
  setExistingCollectionId: () => { },

  startingCollection: undefined,
  setStartingCollection: () => { },

  existingAddressListId: '',
  setExistingAddressListId: () => { },

  transfers: [],
  setTransfers: () => { },
  badgesToCreate: [],
  setBadgesToCreate: () => { },

  customCollection: true,
  setCustomCollection: () => { },

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
  updateCollectionApprovals: true,
  setUpdateCollectionApprovals: () => { },
  updateStandardsTimeline: true,
  setUpdateStandardsTimeline: () => { },
  updateIsArchivedTimeline: true,
  setUpdateIsArchivedTimeline: () => { },

  mintType: MintType.BitBadge,
  setMintType: () => { },

  addressList: {
    listId: '',
    addresses: [],
    allowlist: true,
    uri: '',
    customData: '',

    createdBy: '',
  },
  setAddressList: () => { },

  collectionAddMethod: MetadataAddMethod.None,
  setCollectionAddMethod: () => { },
  badgeAddMethod: MetadataAddMethod.None,
  setBadgeAddMethod: () => { },

  offChainAddMethod: MetadataAddMethod.None,
  setOffChainAddMethod: () => { },

  metadataSize: 0,
  initialLoad: true,
  setInitialLoad: () => { },
  formStepNum: 1,
  setFormStepNum: () => { },
  resetState: () => { },

  completeControl: false,
  setCompleteControl: () => { },
  resetCollectionApprovals: () => [],

  showAdvancedOptions: false,
  setShowAdvancedOptions: () => { },
});

type Props = {
  children?: React.ReactNode
};
export const TxTimelineContextProvider: React.FC<Props> = ({ children }) => {

  const chain = useChainContext();
  const txType = 'UpdateCollection';

  const [existingCollectionId, setExistingCollectionIdState] = useState<bigint>();
  const [existingAddressListId, setExistingAddressListId] = useState<string>('');
  const [formStepNum, setFormStepNum] = useState(1);

  const setExistingCollectionId = (existingCollectionId: bigint | undefined) => {
    setExistingCollectionIdState(existingCollectionId);
  }

  const [startingCollection, setStartingCollection] = useState<BitBadgesCollection<bigint>>();
  const simulatedCollection = useCollection(NEW_COLLECTION_ID);

  const [size, setSize] = useState(0);
  const [badgesToCreate, setBadgesToCreate] = useState<Balance<bigint>[]>([]);
  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [completeControl, setCompleteControl] = useState(false);
  const [customCollection, setCustomCollection] = useState(true);

  const [mintType, setMintType] = useState<MintType>(MintType.BitBadge);

  const [addressList, setAddressList] = useState<AddressList>({
    listId: '',
    addresses: [],
    allowlist: true,
    uri: '',
    customData: '',
    createdBy: chain.address
  })

  //The method used to add metadata to the collection and individual badges
  const [collectionAddMethod, setCollectionAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.Manual);
  const [offChainAddMethod, setOffChainAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.Manual);
  const [badgeAddMethod, setBadgeAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.Manual);

  //Update flags
  const [updateCollectionPermissions, setUpdateCollectionPermissions] = useState(true);
  const [updateManagerTimeline, setUpdateManagerTimeline] = useState(true);
  const [updateCollectionMetadataTimeline, setUpdateCollectionMetadataTimeline] = useState(true);
  const [updateBadgeMetadataTimeline, setUpdateBadgeMetadataTimeline] = useState(true);
  const [updateOffChainBalancesMetadataTimeline, setUpdateOffChainBalancesMetadataTimeline] = useState(true);
  const [updateCustomDataTimeline, setUpdateCustomDataTimeline] = useState(true);
  const [updateCollectionApprovals, setUpdateCollectionApprovals] = useState(true);
  const [updateStandardsTimeline, setUpdateStandardsTimeline] = useState(true);
  const [updateIsArchivedTimeline, setUpdateIsArchivedTimeline] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    resetCollectionApprovals();
  }, [existingCollectionId]);

  const resetCollectionApprovals = () => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: update collection timeline, existing collection changed');
    if (!startingCollection) return [];

    const defaultApprovalsToAdd = [...deepCopy(startingCollection.collectionApprovals)];

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionApprovals: [
        ...defaultApprovalsToAdd,
      ],
    });

    return defaultApprovalsToAdd;
  }


  function resetState(existingCollectionId?: bigint, addressListId?: string) {
    setExistingCollectionIdState(existingCollectionId);
    setStartingCollection(undefined);
    setExistingAddressListId(addressListId ?? '');
    setFormStepNum(1);
    setBadgesToCreate([]);
    setCollectionAddMethod(MetadataAddMethod.Manual);
    setTransfers([]);
    setMintType(MintType.BitBadge);
    setAddressList({
      listId: '',
      addresses: [],
      allowlist: true,
      uri: '',
      customData: '',
      createdBy: chain.address
    })
    setSize(0);

    setUpdateCollectionPermissions(!existingCollectionId);
    setUpdateManagerTimeline(!existingCollectionId);
    setUpdateCollectionMetadataTimeline(!existingCollectionId);
    setUpdateBadgeMetadataTimeline(!existingCollectionId);
    setUpdateOffChainBalancesMetadataTimeline(!existingCollectionId);
    setUpdateCustomDataTimeline(!existingCollectionId);
    setUpdateCollectionApprovals(!existingCollectionId);
    setUpdateStandardsTimeline(!existingCollectionId);
    setUpdateIsArchivedTimeline(!existingCollectionId);

    setCompleteControl(false);
    resetCollectionApprovals();
  }

  //Initial fetch of the address list we are updating an existing one
  useEffect(() => {
    async function getAddressList() {
      if (INFINITE_LOOP_MODE) console.log('useEffect: address list, initial load');
      if (!existingAddressListId) return;
      setMintType(MintType.AddressList);
      const res = await getAddressLists({ listsToFetch: [{ listId: existingAddressListId }] });
      if (res) {
        setAddressList(res.addressLists[0]);
      }
    }
    getAddressList();
  }, [existingAddressListId]);

  const initialLoad = !!startingCollection;


  //Only upon first load, we fetch the existing collection from the server if it exists
  //Set default values for the collection if it doesn't exist or populate with exsitng values if it does
  //Throughout the timeline, we never update the existing collection, only the simulated collection with ID === 0n
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: inital load ');

    async function initialize() {
      let startingCollectionDefault: BitBadgesCollection<bigint> = {
        //Default values for a new collection
        //If existing, they are overriden further below via the spread
        merkleChallenges: [],
        approvalTrackers: [],
        updateHistory: [],
        aliasAddress: '',
        managerTimeline: [{
          manager: chain.cosmosAddress,
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        }],
        cachedCollectionMetadata: DefaultPlaceholderMetadata,
        cachedBadgeMetadata: [],
        activity: [],
        announcements: [],
        reviews: [],
        owners: [{
          _docId: "0:Total",
          collectionId: 0n,
          onChain: true,
          cosmosAddress: 'Total',
          balances: [],
          incomingApprovals: [],
          outgoingApprovals: [],
          userPermissions: {
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          },
          autoApproveSelfInitiatedIncomingTransfers: true,
          autoApproveSelfInitiatedOutgoingTransfers: true,
          updateHistory: [],
        }, {
          _docId: "0:Mint",
          cosmosAddress: 'Mint',
          onChain: true,
          collectionId: 0n,
          balances: [],
          incomingApprovals: [],
          outgoingApprovals: [],
          userPermissions: {
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          },
          autoApproveSelfInitiatedIncomingTransfers: true,
          autoApproveSelfInitiatedOutgoingTransfers: true,
          updateHistory: [],
        }],
        views: {},
        collectionApprovals: [],
        badgeMetadataTimeline: [],
        // standardsTimeline: [{
        //   standards: ["BitBadges"],
        //   timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        // }], TODO:
        standardsTimeline: [],
        balancesType: "Standard",
        collectionMetadataTimeline: [],

        isArchivedTimeline: [],
        customDataTimeline: [],
        collectionPermissions: {
          canArchiveCollection: [],
          canCreateMoreBadges: [],
          canDeleteCollection: [],
          canUpdateBadgeMetadata: [],
          canUpdateCollectionApprovals: [],
          canUpdateCollectionMetadata: [],
          canUpdateCustomData: [],
          canUpdateManager: [],
          canUpdateOffChainBalancesMetadata: [],
          canUpdateStandards: [],
        },
        offChainBalancesMetadataTimeline: [],
        defaultBalances: {
          balances: [],
          incomingApprovals: deepCopy(defaultApprovedOption),
          outgoingApprovals: [],
          userPermissions: {
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          },
          autoApproveSelfInitiatedIncomingTransfers: true,
          autoApproveSelfInitiatedOutgoingTransfers: true,
        },
        createdBy: chain.cosmosAddress,
        createdBlock: 0n,
        createdTimestamp: 0n,

        //Preview / simulated collection values
        // _docId: "0",
        collectionId: 0n
      }

      //TODO: This infinite loops if connected account is not manager of collection bc createdBy is different
      if (!startingCollection || chain.cosmosAddress != startingCollection.createdBy) {
        const existingCollectionsRes = existingCollectionId && existingCollectionId > 0n ? await fetchCollectionsWithOptions(
          [{
            collectionId: existingCollectionId, viewsToFetch: [],
            fetchTotalAndMintBalances: true,
            handleAllAndAppendDefaults: false,
          }], true) : [];

        let existingCollection = existingCollectionId && existingCollectionId > 0n ? existingCollectionsRes[0] : undefined;

        if (existingCollectionId && existingCollectionId > 0n && existingCollection) {
          await fetchAccounts([existingCollection.createdBy, ...existingCollection.managerTimeline.map(x => x.manager), existingCollection.aliasAddress]);
        }

        startingCollectionDefault = {
          ...startingCollectionDefault,
          ...existingCollection,

          //Preview / simulated collection value
          collectionId: 0n
        }

        setStartingCollection(deepCopy(startingCollectionDefault));
        setCollection(startingCollectionDefault);
      }
    }

    initialize();
  }, [existingCollectionId, startingCollection, chain.cosmosAddress]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: update simulation');

    //If badgesToCreate change, we need to update the maxSupplys and unminted supplys field
    //All other updates are handled within CollectionContext
    //Here, we update the preview collection whenever claims, transfers, or badgesToCreate changes

    const newOwnersArr = incrementMintAndTotalBalances(0n, startingCollection?.owners ?? [], badgesToCreate);
    const postSimulatedCollection = { owners: newOwnersArr, collectionId: NEW_COLLECTION_ID };
    updateCollection(postSimulatedCollection);
  }, [badgesToCreate, startingCollection]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  distribution method');
    setTransfers([]);
    if (simulatedCollection?.balancesType === "Off-Chain - Indexed") {
      setUpdateCollectionApprovals(false);
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        collectionApprovals: [],
        defaultBalances: {
          balances: [],
          incomingApprovals: [],
          outgoingApprovals: [],
          userPermissions: {
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          },
          autoApproveSelfInitiatedIncomingTransfers: true,
          autoApproveSelfInitiatedOutgoingTransfers: true,
        },
      });
    } else if (simulatedCollection?.balancesType === "Standard") {
      setUpdateCollectionApprovals(true);
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        offChainBalancesMetadataTimeline: [],
      });
    } else if (simulatedCollection?.balancesType === "Off-Chain - Non-Indexed") {
      setUpdateCollectionApprovals(false);
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        collectionApprovals: [],
        defaultBalances: {
          balances: [],
          incomingApprovals: [],
          outgoingApprovals: [],
          userPermissions: {
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          },
          autoApproveSelfInitiatedIncomingTransfers: true,
          autoApproveSelfInitiatedOutgoingTransfers: true,
        },
        offChainBalancesMetadataTimeline: [],
      });
    }
  }, [simulatedCollection?.balancesType]);

  const context: TxTimelineContextType = {
    resetState,
    txType,
    collectionAddMethod,
    setCollectionAddMethod,
    badgeAddMethod,
    setBadgeAddMethod,

    metadataSize: size,
    existingCollectionId: existingCollectionId,
    startingCollection,
    setStartingCollection,

    resetCollectionApprovals,

    transfers,
    setTransfers,
    badgesToCreate,
    setBadgesToCreate,

    offChainAddMethod,
    setOffChainAddMethod,

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
    updateCollectionApprovals,
    setUpdateCollectionApprovals,
    updateStandardsTimeline,
    setUpdateStandardsTimeline,
    updateIsArchivedTimeline,
    setUpdateIsArchivedTimeline,
    isUpdateAddressList: existingAddressListId ? true : false,

    mintType,
    setMintType,
    customCollection,
    setCustomCollection,
    addressList,
    setAddressList,

    existingAddressListId,
    setExistingAddressListId,

    setExistingCollectionId: setExistingCollectionId,
    initialLoad,
    setInitialLoad: () => { },

    formStepNum,
    setFormStepNum,

    completeControl,
    setCompleteControl,
    showAdvancedOptions,
    setShowAdvancedOptions
  }

  return <TxTimelineContext.Provider value={context}>
    {children}
  </TxTimelineContext.Provider>;
}

export const useTxTimelineContext = () => useContext(TxTimelineContext);