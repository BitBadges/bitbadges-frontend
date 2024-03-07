import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { InputNumber, Typography } from 'antd';
import { BalanceArray, CollectionApprovalWithDetails, filterZeroBalances, getBalancesForIds } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { AddressDisplay } from '../../address/AddressDisplay';
import { BalanceDisplay } from '../../balances/BalanceDisplay';

export const PredeterminedCard = ({
  transfer,
  collectionId,
  numIncrementsOverride
}: {
  collectionId: bigint;
  transfer: CollectionApprovalWithDetails<bigint>;
  numIncrementsOverride?: bigint;
}) => {
  const [orderNumber, setOrderNumber] = useState(Number(numIncrementsOverride ?? 0n));
  const claim = transfer.approvalCriteria?.merkleChallenge;
  const approval = transfer;

  const chain = useChainContext();
  const collection = useCollection(collectionId);

  const approvalCriteria = transfer.approvalCriteria;
  const calculationMethod = transfer.approvalCriteria?.predeterminedBalances?.orderCalculationMethod;
  let trackerType: 'overall' | 'from' | 'to' | 'initiatedBy' = 'overall';
  if (calculationMethod?.useMerkleChallengeLeafIndex) {
  } else if (calculationMethod?.useOverallNumTransfers) trackerType = 'overall';
  else if (calculationMethod?.usePerFromAddressNumTransfers) trackerType = 'from';
  else if (calculationMethod?.usePerToAddressNumTransfers) trackerType = 'to';
  else if (calculationMethod?.usePerInitiatedByAddressNumTransfers) trackerType = 'initiatedBy';

  useEffect(() => {
    //fetch accounts as needed if we iterate through whitelist
    if (claim?.useCreatorAddressAsLeaf && approval.details?.challengeDetails?.leavesDetails.leaves[orderNumber]) {
      fetchAccounts([approvalCriteria?.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[orderNumber] ?? '']);
    }
  }, [orderNumber, claim, approval, approvalCriteria]);

  let approvedAddress = '';
  if (trackerType === 'initiatedBy') approvedAddress = chain.cosmosAddress;
  //TODO: from and to address checks as well

  const approvalTracker = collection?.approvalTrackers.find(
    (x) => x.amountTrackerId === approval.amountTrackerId && x.trackerType === trackerType && x.approvedAddress === approvedAddress
  );

  const numIncrements = numIncrementsOverride ?? approvalTracker?.numTransfers ?? 0n;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim number');
    if (numIncrements > 0n) setOrderNumber(Number(numIncrements));
  }, [numIncrements, setOrderNumber]);

  const incrementedBalances =
    transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.startBalances
      .clone()
      .applyIncrements(
        transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n,
        transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n,
        BigInt(orderNumber)
      ) ?? new BalanceArray<bigint>();

  const hasOverlap =
    incrementedBalances.length > 0
      ? filterZeroBalances(getBalancesForIds(transfer.badgeIds, transfer.ownershipTimes, incrementedBalances)).length > 0
      : orderNumber >= (transfer.approvalCriteria?.predeterminedBalances?.manualBalances.length ?? 0n);
  const exceedsMaxNumTransfers =
    (transfer.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers ?? 0n) > 0n &&
    orderNumber >= (transfer.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers ?? 0n);

  // const hasApprovalAmounts = approvalHasApprovalAmounts(transfer.approvalCriteria?.approvalAmounts);

  // const hasMaxNumTransfers = approvalHasMaxNumTransfers(transfer.approvalCriteria?.maxNumTransfers);

  const hasIncrements = !!(
    transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ||
    transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy
  );
  
  return (
    <>
      {transfer.approvalCriteria?.predeterminedBalances &&
        (transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
          (transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.manualBalances.length > 0)) && (
          <>
            {/* <ul className="list-disc px-8" style={{ textAlign: 'left' }}> */}
            {hasIncrements && (
              <>
                <div className="secondary-text">
                  This claim uses dynamic balances meaning each claim may receive different badges and ownership times. At processing time, we will
                  calculate the badges and ownership times to receive based on a claim number. For this claim,{' '}
                  {Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find((x) => x[1])?.[0] ===
                  'useOverallNumTransfers' ? (
                    <>{'the claim number increments by 1 every use by any user.'}</>
                  ) : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find((x) => x[1])?.[0] ===
                    'useMerkleChallengeLeafIndex' ? (
                    <>{`specific claim numbers are reserved for specific ${transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex && transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? 'whitelisted addresses' : 'claim codes'}.`}</>
                  ) : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find((x) => x[1])?.[0] ===
                    'usePerFromAddressNumTransfers' ? (
                    <>{'claim number starts at 1 for each unique sender (from address) and increments by 1 every transfer from that address.'}</>
                  ) : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find((x) => x[1])?.[0] ===
                    'usePerToAddressNumTransfers' ? (
                    <>{'claim number starts at 1 for each unique recipient (to address) and increments by 1 every transfer to that address.'}</>
                  ) : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find((x) => x[1])?.[0] ===
                    'usePerInitiatedByAddressNumTransfers' ? (
                    <>
                      {
                        'claim number starts at 1 for each unique approver (approved address) and increments by 1 every transfer approver that address.'
                      }
                    </>
                  ) : (
                    <>{''}</>
                  )}{' '}
                  {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy > 0 && (
                    <>
                      Each claim number increments the claimable badge IDs by{' '}
                      {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString()}.
                    </>
                  )}
                  {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy > 0 && (
                    <>
                      Each claim number increments the claimable ownership times by{' '}
                      {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString()}.
                    </>
                  )}
                </div>
              </>
            )}
            <br />
            <div className="flex-center inherit-bg primary-text">
              <div>
                {hasIncrements ? (
                  <>
                    <Typography.Text strong style={{ fontSize: 16 }} className="primary-text">
                      Claim #
                    </Typography.Text>

                    <InputNumber
                      style={{ width: 100 }}
                      value={orderNumber + 1}
                      onChange={(value) => {
                        if (!value) return;
                        setOrderNumber(value - 1);
                      }}
                      className="primary-text inherit-bg"
                    />
                    {claim?.root && calculationMethod?.useMerkleChallengeLeafIndex && (
                      <>
                        <br />

                        {claim?.useCreatorAddressAsLeaf ? (
                          <>
                            <AddressDisplay addressOrUsername={approval.details?.challengeDetails?.leavesDetails.leaves[orderNumber] ?? ''} />
                          </>
                        ) : (
                          <>Code #{orderNumber + 1}</>
                        )}
                      </>
                    )}
                    <br />
                  </>
                ) : (
                  <></>
                )}
                {hasIncrements && (trackerType === 'overall' || trackerType === 'initiatedBy') && (
                  <>
                    {' '}
                    <Typography.Text className="secondary-text" style={{ fontSize: 14, marginTop: 12 }} strong>
                      {`Current - Claim #${BigInt(numIncrements) + 1n}`}
                    </Typography.Text>
                    <br />
                    <br />
                  </>
                )}
                {!hasIncrements ? (
                  <>
                    {transfer.approvalCriteria &&
                      transfer.approvalCriteria?.predeterminedBalances &&
                      transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 && (
                        <>
                          <BalanceDisplay
                            // message={hasIncrements ? `` : 'Balances - All or Nothing'}
                            hideMessage={true}
                            balances={hasOverlap ? incrementedBalances : new BalanceArray<bigint>()}
                            collectionId={collectionId}
                          />
                          {!hasIncrements && !numIncrementsOverride && (
                            <>
                              <br />
                              <div className="secondary-text" style={{ fontSize: 14 }}>
                                <InfoCircleOutlined style={{ marginRight: 4 }} /> All badges shown are to be transferred together.
                              </div>
                            </>
                          )}
                        </>
                      )}
                  </>
                ) : !hasOverlap || exceedsMaxNumTransfers ? (
                  <div className="primary-text">
                    <br />
                    <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> This claim number is not possible because
                    {exceedsMaxNumTransfers && <> it exceeds the max cumulative uses for this approval.</>}
                    {!hasOverlap && !exceedsMaxNumTransfers && <> the badge IDs are no longer in range.</>}
                  </div>
                ) : (
                  <>
                    {transfer.approvalCriteria &&
                      transfer.approvalCriteria?.predeterminedBalances &&
                      transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 && (
                        <>
                          <BalanceDisplay
                            // message={hasIncrements ? `` : 'Balances - All or Nothing'}
                            hideMessage={true}
                            balances={hasOverlap ? incrementedBalances : new BalanceArray<bigint>()}
                            collectionId={collectionId}
                          />
                        </>
                      )}
                  </>
                )}

                {transfer.approvalCriteria &&
                  transfer.approvalCriteria?.predeterminedBalances &&
                  transfer.approvalCriteria?.predeterminedBalances.manualBalances.length > 0 && (
                    <>
                      <BalanceDisplay
                        hideMessage
                        message="Predetermined Balances"
                        balances={
                          orderNumber < transfer.approvalCriteria?.predeterminedBalances.manualBalances.length
                            ? transfer.approvalCriteria?.predeterminedBalances.manualBalances[orderNumber].balances
                            : new BalanceArray<bigint>()
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <b>Order Calculation: </b>
                      {Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find((x) => x[1])?.[0]}
                    </>
                  )}
              </div>
            </div>
            <div>
              {/* <MaxNumTransfersComponent trackedBehindTheScenes transfer={transfer} collectionId={collectionId} address={address} type={trackerType} componentType="card" setAddress={setAddress} /> */}
            </div>
          </>
        )}
    </>
  );
};
