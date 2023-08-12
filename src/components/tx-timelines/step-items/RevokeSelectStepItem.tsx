import { AddressMapping } from "bitbadgesjs-proto";
import { CollectionApprovedTransferWithDetails, getReservedAddressMapping, validateCollectionApprovedTransfersUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function RevokeSelectStepItem(
  updateCollectionApprovedTransfers: boolean,
  // setUpdateCollectionApprovedTransfers: (val: boolean) => void,

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  if (!collection) return EmptyStepItem;

  //Hardcoded and naive

  const err = existingCollection ? validateCollectionApprovedTransfersUpdate(existingCollection.collectionApprovedTransfersTimeline, collection.collectionApprovedTransfersTimeline, existingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers) : undefined;

  const manager = collection.managerTimeline.find(x => x.manager)?.manager ?? '';

  if (!updateCollectionApprovedTransfers) return EmptyStepItem;

  return {
    title: `Revokable?`,
    // description: 
    description: <>{`Once badges are into a user's wallet, should they be revokable or non-revokable by the manager?`}
    </>,
    node:

      <div>

        {err &&
          <div style={{ color: 'red', textAlign: 'center' }}>
            <b>Error: </b>{err.message}
            <br />
            <p>Please resolve this error before continuing.</p>
            <br />
            <p>This error may have happened because this collection used a tool other than this website to be created or updated. If this is the case, certain features may not be fully supported, and we apologize. We are working on 100% compatibility.</p>

          </div>}

        <SwitchForm
          options={[
            {
              title: 'Non-Revokable',
              message: `Badges will be non-transferable.`,
              isSelected: collection.collectionApprovedTransfersTimeline.length > 0 && collection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.find(x => x.initiatedByMappingId === "Manager") === undefined
            },
            {
              title: 'Revokable',
              message: `Badges will be transferable.`,
              isSelected: collection.collectionApprovedTransfersTimeline.length > 0 && collection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.find(x => x.initiatedByMappingId === "Manager") !== undefined
            },
            // {
            //TODO:
            //   title: 'Custom',
            //   disabled: true,
            //   message: `Custom transferability is selected.`,
            //   isSelected: transferable && transferableLength > 1
            // },
          ]}
          onSwitchChange={(idx) => {
            const mintTransfers = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).filter(x => x.fromMappingId === "Mint" && x.initiatedByMappingId !== "Manager");

            const nonMintTransfers = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).filter(x => x.fromMappingId !== "Mint" && x.initiatedByMappingId !== "Manager");

            const transfersToAdd: CollectionApprovedTransferWithDetails<bigint>[] = idx == 0 ? [] : [{
              fromMappingId: "AllWithoutMint",
              toMappingId: "AllWithoutMint",
              initiatedByMappingId: "Manager",
              badgeIds: [{ start: 1n, end: FOREVER_DATE }],
              ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
              toMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
              fromMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
              initiatedByMapping: getReservedAddressMapping("Manager", manager) as AddressMapping,
              approvalDetails: [{
                approvalId: "Revoke",
                uri: "",
                customData: "",
                merkleChallenges: [],
                overridesFromApprovedOutgoingTransfers: true,
                overridesToApprovedIncomingTransfers: true,
                requireFromDoesNotEqualInitiatedBy: false,
                requireFromEqualsInitiatedBy: false,
                requireToDoesNotEqualInitiatedBy: false,
                requireToEqualsInitiatedBy: false,
                mustOwnBadges: [],
                predeterminedBalances: {
                  incrementedBalances: {
                    startBalances: [],
                    incrementBadgeIdsBy: 0n,
                    incrementOwnershipTimesBy: 0n,
                  },
                  manualBalances: [],
                  orderCalculationMethod: {
                    useMerkleChallengeLeafIndex: false,
                    useOverallNumTransfers: false,
                    usePerFromAddressNumTransfers: false,
                    usePerInitiatedByAddressNumTransfers: false,
                    usePerToAddressNumTransfers: false,
                  },
                },
                approvalAmounts: {
                  overallApprovalAmount: 0n,
                  perFromAddressApprovalAmount: 0n,
                  perInitiatedByAddressApprovalAmount: 0n,
                  perToAddressApprovalAmount: 0n,
                },
                maxNumTransfers: {
                  overallMaxNumTransfers: 0n,
                  perFromAddressMaxNumTransfers: 0n,
                  perInitiatedByAddressMaxNumTransfers: 0n,
                  perToAddressMaxNumTransfers: 0n,
                },
              }],
              transferTimes: [{ start: 1n, end: FOREVER_DATE }],
              allowedCombinations: [{
                isApproved: true,
                toMappingOptions: {
                  invertDefault: false,
                  allValues: false,
                  noValues: false
                },
                fromMappingOptions: {
                  invertDefault: false,
                  allValues: false,
                  noValues: false
                },

                initiatedByMappingOptions: {
                  invertDefault: false,
                  allValues: false,
                  noValues: false
                },
                badgeIdsOptions: {
                  invertDefault: false,
                  allValues: false,
                  noValues: false
                },
                ownershipTimesOptions: {
                  invertDefault: false,
                  allValues: false,
                  noValues: false
                },
                transferTimesOptions: {
                  invertDefault: false,
                  allValues: false,
                  noValues: false
                },
              }]
            }];


            collections.updateCollection({
              ...collection,
              collectionApprovedTransfersTimeline: [{
                collectionApprovedTransfers: [...mintTransfers, ...transfersToAdd, ...nonMintTransfers],
                timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
              }]
            });
          }}
        />

      </div >
    ,
    disabled: !!err,
  }
}