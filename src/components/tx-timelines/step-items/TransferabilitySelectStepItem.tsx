import { AddressMapping } from "bitbadgesjs-proto";
import { ApprovedTransferPermissionUsedFlags, castCollectionApprovedTransferPermissionToUniversalPermission, getReservedAddressMapping, validateCollectionApprovedTransfersUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function TransferabilitySelectStepItem(
  updateCollectionApprovedTransfers: boolean,
  setUpdateCollectionApprovedTransfers: (val: boolean) => void,

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  if (!collection) return EmptyStepItem;

  // const approvedTransfers = collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []
  // const lastElement = approvedTransfers.length > 0 ? approvedTransfers[approvedTransfers.length - 1] : undefined;

  //Hardcoded and naive
  const filteredApprovedTransfers = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).filter(x => x.fromMappingId === "Mint" || x.initiatedByMappingId === "Manager");


  const transferableLength = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).length - filteredApprovedTransfers.length;
  const transferable = transferableLength > 0;


  const err = existingCollection ? validateCollectionApprovedTransfersUpdate(existingCollection.collectionApprovedTransfersTimeline, collection.collectionApprovedTransfersTimeline, existingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers) : undefined;

  // let details: UniversalPermissionDetails[] = [];
  // //Currently hardcoded and programmed to only handle [] or [value forever]; no custom 
  // if (collection) {

  //   const existingTranferability: CollectionApprovedTransferTimelineWithDetails<bigint>[] = [];
  //   const newMetadata = collection.collectionApprovedTransfersTimeline;
  //   console.log(newMetadata, existingTranferability);
  //   if (JSON.stringify(existingTranferability) !== JSON.stringify(newMetadata)) {
  //     details.push({
  //       timelineTime: { start: 1n, end: FOREVER_DATE },

  //       badgeId: { start: -1n, end: -1n },
  //       ownershipTime: { start: -1n, end: -1n },
  //       transferTime: { start: -1n, end: -1n },
  //       toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
  //       fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
  //       initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
  //       permittedTimes: [],
  //       forbiddenTimes: [],
  //       arbitraryValue: undefined
  //     });
  //   } else {
  //     equalsExisting = true;
  //   }
  // }

  // const permissions: CollectionApprovedTransferPermissionWithDetails<bigint>[] = [{
  //   defaultValues: {
  //     timelineTimes: [],
  //     ownershipTimes: [],
  //     transferTimes: [],
  //     fromMappingId: 'All',
  //     toMappingId: 'All',
  //     initiatedByMappingId: 'All',
  //     fromMapping: getReservedAddressMapping("All", '') as AddressMapping,
  //     toMapping: getReservedAddressMapping("All", '') as AddressMapping,
  //     initiatedByMapping: getReservedAddressMapping("All", '') as AddressMapping,
  //     forbiddenTimes: [],
  //     permittedTimes: [],
  //     badgeIds: [],
  //   },
  //   combinations: [{
  //     badgeIdsOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     timelineTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     forbiddenTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     permittedTimesOptions: {
  //       invertDefault: false,
  //       allValues: false,
  //       noValues: false,
  //     },
  //     fromMappingOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     toMappingOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     initiatedByMappingOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     transferTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     ownershipTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //   }]
  // }];

  // const err = details.length > 0 ? checkCollectionApprovedTransferPermission(details, permissions) : undefined;


  return {
    title: `Select Transferability`,
    // description: 
    description: <>{`Once badges are into a user's wallet, should they be transferable or non-transferable?`}
      <br /><br />
      {existingCollectionId ? <> {`Current Permission - Can Update Transferability?: `}
        {
          PermissionIcon(
            castCollectionApprovedTransferPermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateCollectionApprovedTransfers ?? []), '', ApprovedTransferPermissionUsedFlags
          )
        }
      </> : <></>}

    </>,
    node: <UpdateSelectWrapper
      updateFlag={updateCollectionApprovedTransfers}
      setUpdateFlag={setUpdateCollectionApprovedTransfers}
      existingCollectionId={existingCollectionId}
      node={


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
                title: 'Non-Transferable',
                message: `Badges will be non-transferable.`,
                isSelected: !transferable
              },
              {
                title: 'Transferable',
                message: `Badges will be transferable.`,
                isSelected: transferable && transferableLength === 1
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

              const newApprovedTransfers = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).filter(x => x.fromMappingId === "Mint" || x.initiatedByMappingId === "Manager");

              if (idx === 1) {
                newApprovedTransfers.push({
                  fromMappingId: "AllWithoutMint",
                  toMappingId: "AllWithoutMint",
                  initiatedByMappingId: "AllWithoutMint",
                  badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                  ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
                  toMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
                  fromMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
                  initiatedByMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
                  approvalDetails: [], //no restrictions
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

                });
              }

              collections.updateCollection({
                ...collection,
                collectionApprovedTransfersTimeline: [{
                  collectionApprovedTransfers: newApprovedTransfers,
                  timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                }]
              });
            }}
          />

        </div >
      }
    />,
    disabled: !!err,
  }
}