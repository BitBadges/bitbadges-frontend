import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { DevMode } from '../../common/DevMode';

import { Button, Divider } from 'antd';
import { AddressMapping } from 'bitbadgesjs-proto';
import { DistributionMethod, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useRef, useState } from 'react';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { GO_MAX_UINT_64 } from '../../../utils/dates';
import { ClaimSelect } from '../../transfers/TransferOrClaimSelect';
import { SwitchForm } from './SwitchForm';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

const crypto = require('crypto');

export function CreateClaims({ setVisible }: { setVisible: (visible: boolean) => void }) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const approvalsToAdd = txTimelineContext.approvalsToAdd;
  const setApprovalsToAdd = txTimelineContext.setApprovalsToAdd;
  const transfers = txTimelineContext.transfers;
  const setTransfers = txTimelineContext.setTransfers;
  const chain = useChainContext();
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);


  //We can either specify specific badges to distribute or distribute the whole collection if blank
  const originalSenderBalances = collection?.balancesType === "Off-Chain" ?
    collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances || []
    : collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances || [];


  const neverHasManager = collection?.managerTimeline.length == 0 || collection?.managerTimeline.every(x => !x.manager);
  const isOffChainBalances = collection?.balancesType === "Off-Chain";


  const options = [];
  options.push({
    title: 'First Come, First Serve',
    message: `First come, first serve until all badges are claimed.`,
    isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
  });


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
    disabled: neverHasManager
  }

  if (startingCollection && startingCollection.balancesType === "Off-Chain") {
    // options.push(OffChainBalancesStep);
  } else if (startingCollection) {
    options.push(
      CodesStep,
      WhitelistStep
    );

    options.push(ManualTransferStep);
  } else {

    options.push(
      CodesStep,
      WhitelistStep
    );

    options.push(ManualTransferStep);
  }

  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));
  //TODO: Make this more dynamic
  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    {!isOffChainBalances && <>
      <div>
        <SwitchForm
          options={options}
          onSwitchChange={(_idx, newTitle) => {
            if (!collection) return;

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
            } else if (newTitle == 'Manual Transfer') {
              setDistributionMethod(DistributionMethod.DirectTransfer);
            }
          }}
        />
      </div>
    </>}
    {!isOffChainBalances && (DistributionMethod.None === distributionMethod
      || distributionMethod === DistributionMethod.Unminted
      || distributionMethod === DistributionMethod.OffChainBalances
      || distributionMethod === DistributionMethod.DirectTransfer
      || distributionMethod === DistributionMethod.JSON
    ) ? <></> :
      <div>
        <ClaimSelect
          originalSenderBalances={originalSenderBalances}
          sender={'Mint'}
          collectionId={MSG_PREVIEW_ID}
          hideTransferDisplay={true}
          setVisible={setVisible}
          distributionMethod={isOffChainBalances ? DistributionMethod.OffChainBalances : distributionMethod}
          approvalsToAdd={approvalsToAdd}
          setApprovalsToAdd={setApprovalsToAdd}
          transfers={transfers}
          setTransfers={setTransfers}
        />
      </div>}
    {!isOffChainBalances && distributionMethod === DistributionMethod.DirectTransfer && <div>
      <Divider />
      <Button
        onClick={() => {
          if (!collection) return;

          const defaultApprovalsToAdd = [...approvalsToAdd];
          //Put at beginning of list
          defaultApprovalsToAdd.unshift({
            fromMappingId: 'Mint',
            toMappingId: 'AllWithMint',
            initiatedByMappingId: chain.cosmosAddress,
            initiatedByMapping: getReservedAddressMapping(chain.cosmosAddress) as AddressMapping,
            fromMapping: getReservedAddressMapping('Mint') as AddressMapping,
            toMapping: getReservedAddressMapping('AllWithMint') as AddressMapping,
            transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
            approvalId: amountTrackerId.current,
            amountTrackerId: amountTrackerId.current,
            challengeTrackerId: '',
            approvalCriteria: {
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
              merkleChallenge: {
                root: '',
                maxOneUsePerLeaf: false,
                expectedProofLength: 0n,
                useCreatorAddressAsLeaf: false,
                uri: '',
                customData: '',
              },
              requireToEqualsInitiatedBy: false,
              requireFromEqualsInitiatedBy: false,
              requireToDoesNotEqualInitiatedBy: false,
              requireFromDoesNotEqualInitiatedBy: false,


              overridesToIncomingApprovals: false,
              overridesFromOutgoingApprovals: true,
            },
          });

          setApprovalsToAdd(defaultApprovalsToAdd);
          setVisible(false);
        }}
        type='primary'
        className='full-width'
      >
        Add Distribution
      </Button>
    </div>
    }
    <DevMode obj={txTimelineContext.approvalsToAdd} />
  </div >
}