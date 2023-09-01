import { AddressMapping } from "bitbadgesjs-proto";
import { DistributionMethod, getReservedAddressMapping } from "bitbadgesjs-utils";
import { useRef } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { SwitchForm } from "../form-items/SwitchForm";
import { MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
const crypto = require('crypto');

export function DistributionMethodStepItem(
  distributionMethod: DistributionMethod,
  setDistributionMethod: (newDistributionMethod: DistributionMethod) => void,
  existingCollectionId?: bigint,
  hideUnminted: boolean = false,
  hideFirstComeFirstServe: boolean = false,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  //If all supply amounts are 1, it is fungible
  // const fungible = badgesToCreate.length === 1 && badgesToCreate[0].badgeIds.length == 1 && badgesToCreate[0].badgeIds[0].start == badgesToCreate[0].badgeIds[0].end;
  // const nonFungible = badgesToCreate.every(badgeSupply => badgeSupply.amount === 1n);
  const neverHasManager = collection?.managerTimeline.length == 0 || collection?.managerTimeline.every(x => !x.manager);
  const options = [];
  if (!hideFirstComeFirstServe) {
    options.push({
      title: 'Open to Anyone',
      message: `First come, first serve until all badges are claimed.`,
      isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
    });
  }

  const CodesStep = {
    title: 'Codes',
    message: `Generate secret codes or passwords that can be entered by users to claim badges. These can be distributed to users however you would like (email, social media, etc). ${!neverHasManager ? '\n\nIMPORTANT: Codes / passwords will only ever be viewable by the current collection manager.' : 'Currently only available with a manager.'}`,
    isSelected: distributionMethod == DistributionMethod.Codes,
    disabled: neverHasManager
  }

  const WhitelistStep = {
    title: 'Whitelist',
    message: 'Define specific addresses that will be able to claim this badge.',
    isSelected: distributionMethod == DistributionMethod.Whitelist,
  }

  const ManualTransferStep = {
    title: 'Manual Transfer',
    message: 'The manager will be approved to freely transfer badges to any address from the Mint address. Note the manager will pay all transfer fees. This can be done via transfer transactions after the collection has been created.',
    isSelected: distributionMethod == DistributionMethod.DirectTransfer,
  }

  const OffChainBalancesStep = {
    title: 'Off-Chain Balances',
    message: <div className='flex-center flex-column'><span>Balances will be stored on a typical server (not the blockchain) for enhanced scalability and user experience. All balances must be assigned. Users do not need to claim. This option should only be used for specific use cases. Learn more
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a></span>
      {neverHasManager && <>
        <br /> <br />
        IMPORTANT: Updating balances in the future is a manager-only privilege, and this collection does / will not have a manager. The selected balances will be PERMANENT and FROZEN.
      </>}

    </div>,
    isSelected: distributionMethod == DistributionMethod.OffChainBalances,
  }



  if (existingCollection && existingCollection.balancesType === "Off-Chain") {
    options.push(OffChainBalancesStep);
  } else if (existingCollection) {
    options.push(
      CodesStep,
      WhitelistStep,

      // {
      //   title: 'JSON',
      //   message: 'Advanced option. Upload a JSON file, specifying how to distribute your badges. See BitBadges documentation for more info.',
      //   isSelected: distributionMethod == DistributionMethod.JSON,
      // }
    );

    if (!neverHasManager) options.push(ManualTransferStep);
  } else {

    options.push(
      CodesStep,
      WhitelistStep,
      OffChainBalancesStep
    );

    if (!neverHasManager) options.push(ManualTransferStep);
  }

  if (!hideUnminted) {
    options.push({
      title: 'Unminted',
      message: 'Do nothing now.' + (neverHasManager && (collection?.owners.find(x => x.cosmosAddress === "Mint")?.balances ?? []).length > 0 ? ' IMPORTANT: You have selected to have no manager for this collection, but there are current badges that are unminted and undistributed. These badges will be permanently frozen and unable to be distributed if this option is selected.' : ''),
      isSelected: distributionMethod == DistributionMethod.Unminted,
      // disabled: neverHasManager
    })
  }


  const approvalId = useRef(crypto.randomBytes(32).toString('hex'));


  return {
    title: `Distribution Method`,
    description: '',
    node: <div>
      <SwitchForm

        options={options}
        onSwitchChange={(_idx, newTitle) => {
          if (!collection) return;

          if (newTitle == 'Open to Anyone') {
            setDistributionMethod(DistributionMethod.FirstComeFirstServe);
          } else if (newTitle == 'Codes') {
            setDistributionMethod(DistributionMethod.Codes);
          } else if (newTitle == 'Whitelist') {
            setDistributionMethod(DistributionMethod.Whitelist);
          } else if (newTitle == 'JSON') {
            setDistributionMethod(DistributionMethod.JSON);
          } else if (newTitle == 'Unminted') {
            setDistributionMethod(DistributionMethod.Unminted);
          } else if (newTitle == 'Off-Chain Balances') {
            setDistributionMethod(DistributionMethod.OffChainBalances);
            collections.updateCollection({
              ...collection,
              collectionApprovedTransfersTimeline: [],

              offChainBalancesMetadataTimeline: [],
            });
          } else if (newTitle == 'Manual Transfer') {

            setDistributionMethod(DistributionMethod.DirectTransfer);

            if (!collection) return;

            //Slot it right in the middle of [existing from "Mint", toAdd, non-"Mint"]
            const existingFromMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
              ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId === 'Mint') : [];

            const existingNonMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
              ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId !== 'Mint') : [];

            const manager = collection.managerTimeline.length > 0 ? collection.managerTimeline[0].manager : '';

            collections.updateCollection({
              ...collection,
              collectionApprovedTransfersTimeline: [{
                collectionApprovedTransfers: [
                  ...existingFromMint,
                  {
                    fromMappingId: 'Mint',
                    toMappingId: 'AllWithMint',
                    initiatedByMappingId: 'Manager',
                    initiatedByMapping: getReservedAddressMapping('Manager', manager) as AddressMapping,
                    fromMapping: getReservedAddressMapping('Mint', '') as AddressMapping,
                    toMapping: getReservedAddressMapping('AllWithMint', '') as AddressMapping,
                    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    allowedCombinations: [{
                      initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                      ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      isApproved: true,
                    }],
                    approvalDetails: [{
                      approvalId: approvalId.current,
                      uri: '',
                      customData: '',
                      mustOwnBadges: [],
                      approvalAmounts: {
                        overallApprovalAmount: 0n,
                        perFromAddressApprovalAmount: 0n,
                        perToAddressApprovalAmount: 0n,
                        perInitiatedByAddressApprovalAmount: 0n,
                      },
                      maxNumTransfers: {
                        overallMaxNumTransfers: 0n,
                        perFromAddressMaxNumTransfers: 0n,
                        perToAddressMaxNumTransfers: 0n,
                        perInitiatedByAddressMaxNumTransfers: 0n,
                      },
                      predeterminedBalances: {
                        manualBalances: [],
                        incrementedBalances: {
                          startBalances: [],
                          incrementBadgeIdsBy: 0n,
                          incrementOwnershipTimesBy: 0n,
                        },
                        orderCalculationMethod: {
                          useMerkleChallengeLeafIndex: false,
                          useOverallNumTransfers: false,
                          usePerFromAddressNumTransfers: false,
                          usePerInitiatedByAddressNumTransfers: false,
                          usePerToAddressNumTransfers: false,
                        },
                      },
                      merkleChallenges: [],
                      requireToEqualsInitiatedBy: false,
                      requireFromEqualsInitiatedBy: false,
                      requireToDoesNotEqualInitiatedBy: false,
                      requireFromDoesNotEqualInitiatedBy: false,


                      overridesToApprovedIncomingTransfers: false,
                      overridesFromApprovedOutgoingTransfers: true,
                    }]

                  },
                  ...existingNonMint],
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }]
              }]
            });
          }
        }}
      />
    </div>,
    disabled: distributionMethod == DistributionMethod.None
  }
}