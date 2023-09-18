import { Typography } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { DistributionMethod, getCurrentValueForTimeline, getReservedAddressMapping } from "bitbadgesjs-utils";
import { useRef, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import { SwitchForm } from "../form-items/SwitchForm";
const crypto = require('crypto');

export function DistributionMethodStepItem() {
  const hideUnminted = false;
  const hideFirstComeFirstServe = false;

  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const distributionMethod = txTimelineContext.distributionMethod;
  const setDistributionMethod = txTimelineContext.setDistributionMethod;
  const setApprovedTransfersToAdd = txTimelineContext.setApprovedTransfersToAdd;


  const [lastClickedTitle, setLastClickedTitle] = useState<string | undefined>(undefined);

  const neverHasManager = collection?.managerTimeline.length == 0 || collection?.managerTimeline.every(x => !x.manager);
  const options = [];
  if (!hideFirstComeFirstServe) {
    options.push({
      title: 'First Come, First Serve',
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

  const JsonStep = {
    title: 'JSON',
    message: 'Advanced option. Requires technical skills. Enter a JSON specifying the transferability of this collection. See BitBadges documentation for more info.',
    isSelected: distributionMethod == DistributionMethod.JSON,
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
    disabled: neverHasManager
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



  if (startingCollection && startingCollection.balancesType === "Off-Chain") {
    options.push(OffChainBalancesStep);
  } else if (startingCollection) {
    options.push(
      CodesStep,
      WhitelistStep,
      JsonStep
    );

    options.push(ManualTransferStep);
  } else {

    options.push(
      CodesStep,
      WhitelistStep,
      OffChainBalancesStep,
      JsonStep
    );

    options.push(ManualTransferStep);
  }

  if (!hideUnminted) {
    options.push({
      title: 'Do Nothing',
      message: `Do nothing. ${existingCollectionId !== undefined && existingCollectionId > 0n ? 'Leave as currently set.' : ''}` + (neverHasManager && (collection?.owners.find(x => x.cosmosAddress === "Mint")?.balances ?? []).length > 0 ? ' IMPORTANT: You have selected to not have a maanger moving forward. This means the distribution process is frozen and can never be updated. Ensure all badges can be distributed as desired.' : ''),
      isSelected: distributionMethod == DistributionMethod.Unminted,
      // disabled: neverHasManager
    })
  }


  const approvalTrackerId = useRef(crypto.randomBytes(32).toString('hex'));

  return {
    title: `Distribution Method`,
    description: '',
    node: <div>
      <SwitchForm

        options={options}
        onSwitchChange={(_idx, newTitle) => {
          if (!collection) return;

          const defaultApprovedTransfersToAdd = txTimelineContext.resetApprovedTransfersToAdd();

          setLastClickedTitle(newTitle);

          if (newTitle == 'First Come, First Serve') {
            setDistributionMethod(DistributionMethod.FirstComeFirstServe);
          } else if (newTitle == 'Codes') {
            setDistributionMethod(DistributionMethod.Codes);
          } else if (newTitle == 'Whitelist') {
            setDistributionMethod(DistributionMethod.Whitelist);
          } else if (newTitle == 'JSON') {
            setDistributionMethod(DistributionMethod.JSON);
          } else if (newTitle == 'Do Nothing') {
            setDistributionMethod(DistributionMethod.Unminted);
          } else if (newTitle == 'Off-Chain Balances') {
            setDistributionMethod(DistributionMethod.OffChainBalances);
            collections.updateCollection({
              ...collection,
              collectionApprovedTransfers: [],
              offChainBalancesMetadataTimeline: [],
            });
          } else if (newTitle == 'Manual Transfer') {

            setDistributionMethod(DistributionMethod.DirectTransfer);

            if (!collection) return;
            const manager = getCurrentValueForTimeline(collection.managerTimeline)?.manager ?? '';
            defaultApprovedTransfersToAdd.push({
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
                initiatedByMappingOptions: {},
                fromMappingOptions: {},
                toMappingOptions: {},
                badgeIdsOptions: {},
                ownershipTimesOptions: {},
                transferTimesOptions: {},
                isApproved: true,
              }],
              approvalDetails: [{
                approvalTrackerId: approvalTrackerId.current,
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
                  precalculationId: '',
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
              }],
              balances: [{
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                amount: 1n
              }]
            });

          }

          if (newTitle !== lastClickedTitle || newTitle == 'Manual Transfer') {
            setApprovedTransfersToAdd(defaultApprovedTransfersToAdd);
          }
        }}
      />
      {<>

        <br />
        <hr />
        <br />
        <div className='flex-center'>
          <Typography.Text className='primary-text' strong style={{ fontSize: 24, textAlign: 'center' }}>
            Approved Transfers To Add
          </Typography.Text>
        </div>

        <div className='flex-center' style={{ textAlign: 'center' }}>
          <TransferabilityTab collectionId={MSG_PREVIEW_ID} isClaimSelect showOnlyTxApprovedTransfersToAdd />
        </div>
        <hr />
        <br />
        <div className='flex-center'>
          <Typography.Text className='primary-text' strong style={{ fontSize: 24, textAlign: 'center' }}>
            Distribution
          </Typography.Text>
        </div>

        <div className='flex-center' style={{ textAlign: 'center' }}>
          <TransferabilityTab collectionId={MSG_PREVIEW_ID} isClaimSelect />
        </div>
      </>}
    </div>,
    disabled: distributionMethod == DistributionMethod.None
      || (neverHasManager && distributionMethod == DistributionMethod.DirectTransfer)
      || (neverHasManager && distributionMethod == DistributionMethod.Codes)
  }
}