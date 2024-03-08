import { WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { BalanceArray } from 'bitbadgesjs-sdk';
import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { DistributionMethod } from '../../../bitbadges-api/types';
import {
  approvalCriteriaUsesPredeterminedBalances,
  approvalHasApprovalAmounts,
  approvalHasMaxNumTransfers
} from '../../../bitbadges-api/utils/claims';
import { getBadgeIdsString } from '../../../utils/badgeIds';
import { getTimeRangesElement } from '../../../utils/dates';
import { BalanceDisplay } from '../../balances/BalanceDisplay';
import { ApprovalAmounts as ApprovalAmountsComponent } from './ApprovalAmountsSelectComponent';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { NumberInput } from '../../inputs/NumberInput';
import { RadioGroup } from '../../inputs/Selects';
import { RequiredApprovalProps, DistributionType, PredeterminedTab, getMaxIncrementsApplied } from '../ApprovalSelect';
import { MaxUses } from './MaxUsesSelectComponent';
import { OrderCalculationMethod } from './OrderCalculationComponent';

export const ApprovalSelectAmountsCard = ({
  approvalToAdd,
  setApprovalToAdd,
  expectedPartitions,
  distributionMethod,
  distributionType,
  collectionId,
  fromListLocked,
  toListLocked,
  initiatedByListLocked
}: {
  expectedPartitions: bigint;
  approvalToAdd: RequiredApprovalProps;
  setApprovalToAdd: Dispatch<SetStateAction<RequiredApprovalProps>>;
  distributionMethod: DistributionMethod;
  distributionType: DistributionType;
  collectionId: bigint;
  fromListLocked: boolean;
  toListLocked: boolean;
  initiatedByListLocked: boolean;
}) => {
  const [tab, setTab] = useState(
    approvalCriteriaUsesPredeterminedBalances(approvalToAdd.approvalCriteria) ? PredeterminedTab.AllOrNothing : PredeterminedTab.Tally
  );

  const predeterminedBalances = approvalToAdd.approvalCriteria.predeterminedBalances;
  const isPartitionView = predeterminedBalances.incrementedBalances.incrementBadgeIdsBy > 0n;
  const orderCalculationMethod = approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod;
  const increment = predeterminedBalances.incrementedBalances.incrementBadgeIdsBy;
  const startBalances = predeterminedBalances.incrementedBalances.startBalances;

  //We default to the overall max uses if we only have one address
  //If to == initiator or from == initiator, we default to initiated by for sender and recipient (which may default to overall)
  const initiatedByHasMaxOneAddress = approvalToAdd.initiatedByList.addresses.length <= 1 && approvalToAdd.initiatedByList.whitelist;
  const fromHasMaxOneAddress = approvalToAdd.fromList.addresses.length <= 1 && approvalToAdd.fromList.whitelist;
  const toHasMaxOneAddress = approvalToAdd.toList.addresses.length <= 1 && approvalToAdd.toList.whitelist;

  const initiatedByDefaultsToOther = initiatedByHasMaxOneAddress;
  const fromDefaultsToOther = fromListLocked || approvalToAdd.approvalCriteria.requireFromEqualsInitiatedBy || fromHasMaxOneAddress;
  const toDefaultsToOther = toListLocked || approvalToAdd.approvalCriteria.requireToEqualsInitiatedBy || toHasMaxOneAddress;

  const customClaim = distributionMethod === DistributionMethod.Codes && distributionType === DistributionType.Builder;

  //If we are using increments, we should always be on the AllOrNothing tab
  //Else, we default to Tally
  useEffect(() => {
    console.log('useEffect 0', isPartitionView, tab);
    if ((isPartitionView || customClaim) && tab !== PredeterminedTab.AllOrNothing) {
      setTab(PredeterminedTab.AllOrNothing);
    }
  }, [isPartitionView, tab, customClaim]);

  //If we are using predetermined balances, we have to set the start balances
  useEffect(() => {
    console.log('useEffect 1', isPartitionView, tab);
    if (isPartitionView || customClaim || tab === PredeterminedTab.AllOrNothing) {
      setApprovalToAdd((approvalToAdd) => {
        return {
          ...approvalToAdd,
          approvalCriteria: {
            ...approvalToAdd.approvalCriteria,
            approvalAmounts: {
              overallApprovalAmount: 0n,
              perFromAddressApprovalAmount: 0n,
              perToAddressApprovalAmount: 0n,
              perInitiatedByAddressApprovalAmount: 0n
            },
            predeterminedBalances: {
              ...approvalToAdd.approvalCriteria.predeterminedBalances,

              incrementedBalances: {
                ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                startBalances: [
                  {
                    badgeIds: approvalToAdd.badgeIds,
                    ownershipTimes: approvalToAdd.ownershipTimes,
                    amount: 1n
                  }
                ]
              },
              orderCalculationMethod: {
                ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
                useOverallNumTransfers: false,
                usePerFromAddressNumTransfers: false,
                usePerInitiatedByAddressNumTransfers: false,
                usePerToAddressNumTransfers: false,
                useMerkleChallengeLeafIndex: false
              }
            }
          }
        };
      });
    } else {
      setApprovalToAdd((approvalToAdd) => {
        return {
          ...approvalToAdd,
          approvalCriteria: {
            ...approvalToAdd.approvalCriteria,
            predeterminedBalances: {
              ...approvalToAdd.approvalCriteria.predeterminedBalances,
              incrementedBalances: {
                startBalances: [],
                incrementBadgeIdsBy: 0n,
                incrementOwnershipTimesBy: 0n
              },
              orderCalculationMethod: {
                ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
                useOverallNumTransfers: false,
                usePerFromAddressNumTransfers: false,
                usePerInitiatedByAddressNumTransfers: false,
                usePerToAddressNumTransfers: false,
                useMerkleChallengeLeafIndex: false
              }
            }
          }
        };
      });
    }
  }, [tab, isPartitionView, setApprovalToAdd, customClaim, approvalToAdd.badgeIds, approvalToAdd.ownershipTimes]);

  const AllMaxUses = (
    <div className="full-width">
      <MaxUses
        approvalToAdd={approvalToAdd}
        setApprovalToAdd={setApprovalToAdd}
        type="overall"
        distributionMethod={distributionMethod}
        disabled={distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.Whitelist}
      />
      {!initiatedByDefaultsToOther && (
        <MaxUses
          approvalToAdd={approvalToAdd}
          setApprovalToAdd={setApprovalToAdd}
          type="initiatedBy"
          distributionMethod={distributionMethod}
          disabled={
            (distributionMethod === DistributionMethod.Codes && distributionType === DistributionType.Builder) ||
            distributionMethod === DistributionMethod.Whitelist
          }
        />
      )}
      {!fromDefaultsToOther && (
        <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} distributionMethod={distributionMethod} type="from" />
      )}
      {!toDefaultsToOther && (
        <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} distributionMethod={distributionMethod} type="to" />
      )}
    </div>
  );

  const AllApprovalAmounts = (
    <>
      {!approvalHasApprovalAmounts(approvalToAdd.approvalCriteria.approvalAmounts) && (
        <div style={{ textAlign: 'center' }} className="mt-2">
          <div style={{ textAlign: 'center' }}>
            <WarningOutlined style={{ color: '#FF5733' }} />
            <span style={{ marginLeft: 8, color: '#FF5733' }}>
              Without any selections, there will be no amount restrictions (unlimited quantity approved).
            </span>
          </div>
        </div>
      )}

      <ApprovalAmountsComponent
        approvalToAdd={approvalToAdd}
        setApprovalToAdd={setApprovalToAdd}
        collectionId={collectionId}
        distributionMethod={distributionMethod}
        type="overall"
        label="Overall"
      />
      {!fromDefaultsToOther && (
        <ApprovalAmountsComponent
          approvalToAdd={approvalToAdd}
          setApprovalToAdd={setApprovalToAdd}
          collectionId={collectionId}
          distributionMethod={distributionMethod}
          type="from"
          label="Per sender"
        />
      )}
      {!toDefaultsToOther && (
        <ApprovalAmountsComponent
          approvalToAdd={approvalToAdd}
          setApprovalToAdd={setApprovalToAdd}
          collectionId={collectionId}
          distributionMethod={distributionMethod}
          type="to"
          label="Per recipient"
        />
      )}
      {!initiatedByDefaultsToOther && (
        <ApprovalAmountsComponent
          approvalToAdd={approvalToAdd}
          setApprovalToAdd={setApprovalToAdd}
          collectionId={collectionId}
          distributionMethod={distributionMethod}
          type="initiatedBy"
          label="Per approver"
        />
      )}
    </>
  );

  return (
    <InformationDisplayCard md={8} xs={24} sm={24} title="Amounts" subtitle="Select the amounts to approve.">
      {(approvalToAdd.badgeIds.length === 0 || approvalToAdd.ownershipTimes.length === 0) && (
        <div style={{ color: 'red' }}>
          <WarningOutlined /> Badge IDs and / or ownership times cannot be empty.
        </div>
      )}
      {approvalToAdd.badgeIds.length > 0 && approvalToAdd.ownershipTimes.length > 0 && (
        <div className="">
          {!isPartitionView && (
            <>
              {distributionMethod !== DistributionMethod.Codes && (
                <>
                  <RadioGroup
                    value={tab !== PredeterminedTab.AllOrNothing ? (tab === PredeterminedTab.NoLimit ? 'none' : 'tally') : 'all'}
                    onChange={(e) => {
                      if (e === 'tally') {
                        setTab(PredeterminedTab.Tally);
                      }
                      if (e === 'all') {
                        setTab(PredeterminedTab.AllOrNothing);
                      }
                      if (e === 'none') {
                        setTab(PredeterminedTab.NoLimit);
                      }
                    }}
                    options={[
                      { label: 'All or Nothing', value: 'all' },
                      { label: 'Tally', value: 'tally' },
                      { label: 'No Limit', value: 'none' }
                    ]}
                  />
                </>
              )}
              {tab === PredeterminedTab.NoLimit && (
                <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className="secondary-text full-width">
                    <div className="">
                      <InfoCircleOutlined /> No Limit - No amount restrictions. Amounts will not be tracked. You can optionally choose to restrict the
                      max number of uses, but each use will still approve an unlimited amount.
                    </div>
                  </div>

                  <br />
                  {AllMaxUses}
                </>
              )}
              {tab === PredeterminedTab.Tally && (
                <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className="secondary-text">
                    <div className="">
                      <InfoCircleOutlined /> Tally - Approvals will correspond to the selected badge IDs ({getBadgeIdsString(approvalToAdd.badgeIds)})
                      and times ({getTimeRangesElement(approvalToAdd.ownershipTimes)}). You can set the limit for the amount approved on an overall
                      (all users), per recipient, per sender, and / or per approver basis.
                    </div>
                  </div>
                </>
              )}
              {tab === PredeterminedTab.AllOrNothing && (
                <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className="secondary-text">
                    <div className="">
                      <InfoCircleOutlined /> All or Nothing - The approval is only valid if all are transferred together.
                    </div>
                  </div>
                </>
              )}
              {/* <br /> */}
              {!isPartitionView && tab === PredeterminedTab.Tally && (
                <>
                  {AllApprovalAmounts}
                  <br />
                  {AllMaxUses}
                </>
              )}

              {!isPartitionView && tab === PredeterminedTab.AllOrNothing && (
                <>
                  <div style={{ textAlign: 'center', margin: 10 }}>
                    <div style={{ textAlign: 'center', margin: 10 }}>
                      <NumberInput
                        title={'Amount per Use'}
                        min={1}
                        value={startBalances.length > 0 ? Number(startBalances[0].amount) : 0}
                        setValue={(amount) => {
                          if (amount < 0) amount = 0;
                          setApprovalToAdd({
                            ...approvalToAdd,
                            approvalCriteria: {
                              ...approvalToAdd.approvalCriteria,
                              predeterminedBalances: {
                                ...approvalToAdd.approvalCriteria.predeterminedBalances,
                                incrementedBalances: {
                                  ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                                  startBalances: [
                                    {
                                      badgeIds: approvalToAdd.badgeIds,
                                      ownershipTimes: approvalToAdd.ownershipTimes,
                                      amount: BigInt(amount)
                                    }
                                  ]
                                },
                                orderCalculationMethod: {
                                  ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
                                  useOverallNumTransfers: true,
                                  usePerFromAddressNumTransfers: false,
                                  usePerInitiatedByAddressNumTransfers: false,
                                  usePerToAddressNumTransfers: false,
                                  useMerkleChallengeLeafIndex: false
                                }
                              }
                            }
                          });
                        }}
                      />
                    </div>
                  </div>

                  {!approvalHasMaxNumTransfers(approvalToAdd.approvalCriteria.maxNumTransfers) && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <WarningOutlined style={{ color: '#FF5733' }} />
                        <span style={{ marginLeft: 8, color: '#FF5733' }}>
                          This approval approves x{startBalances.length > 0 ? Number(startBalances[0].amount) : 0} of the selected badges{' '}
                          <b>per use</b> in an all or nothing manner. However, you have not set a limit on max uses, meaning an unlimited quantity is
                          approved.
                        </span>
                      </div>
                    </div>
                  )}

                  <br />
                  {AllMaxUses}
                  <br />
                  <BalanceDisplay
                    message={`Approved Badges ${getMaxIncrementsApplied(approvalToAdd) > 0n ? `(${getMaxIncrementsApplied(approvalToAdd)} Uses)` : 'per Use'}`}
                    hideMessage
                    collectionId={collectionId}
                    balances={BalanceArray.From(startBalances)}
                    incrementBadgeIdsBy={increment}
                    numIncrements={getMaxIncrementsApplied(approvalToAdd)}
                  />
                </>
              )}
            </>
          )}

          {isPartitionView && (
            <>
              {
                <>
                  <b style={{ fontSize: 16 }}> </b>
                  <OrderCalculationMethod
                    expectedPartitions={expectedPartitions}
                    approvalToAdd={approvalToAdd}
                    setApprovalToAdd={setApprovalToAdd}
                    collectionId={collectionId}
                    distributionType={distributionType}
                    distributionMethod={distributionMethod}
                    increment={increment}
                    startBalances={BalanceArray.From(startBalances)}
                    keyId="useOverallNumTransfers"
                    label="Increment per use?"
                  />
                  {!toDefaultsToOther && (
                    <OrderCalculationMethod
                      expectedPartitions={expectedPartitions}
                      approvalToAdd={approvalToAdd}
                      setApprovalToAdd={setApprovalToAdd}
                      collectionId={collectionId}
                      distributionType={distributionType}
                      distributionMethod={distributionMethod}
                      increment={increment}
                      startBalances={BalanceArray.From(startBalances)}
                      keyId="usePerToAddressNumTransfers"
                      label="Increment per unique recipient?"
                    />
                  )}
                  {!fromListLocked && !approvalToAdd.approvalCriteria.requireFromEqualsInitiatedBy && !fromHasMaxOneAddress && (
                    <OrderCalculationMethod
                      expectedPartitions={expectedPartitions}
                      approvalToAdd={approvalToAdd}
                      setApprovalToAdd={setApprovalToAdd}
                      collectionId={collectionId}
                      distributionType={distributionType}
                      distributionMethod={distributionMethod}
                      increment={increment}
                      startBalances={BalanceArray.From(startBalances)}
                      keyId="usePerFromAddressNumTransfers"
                      label="Increment per unique sender"
                    />
                  )}
                  {!initiatedByListLocked && distributionType !== DistributionType.Builder && !initiatedByHasMaxOneAddress && (
                    <OrderCalculationMethod
                      expectedPartitions={expectedPartitions}
                      approvalToAdd={approvalToAdd}
                      setApprovalToAdd={setApprovalToAdd}
                      collectionId={collectionId}
                      distributionType={distributionType}
                      distributionMethod={distributionMethod}
                      increment={increment}
                      startBalances={BalanceArray.From(startBalances)}
                      keyId="usePerInitiatedByAddressNumTransfers"
                      label="Increment per unique approved address?"
                    />
                  )}
                  {distributionType !== DistributionType.Builder && (
                    <OrderCalculationMethod
                      expectedPartitions={expectedPartitions}
                      approvalToAdd={approvalToAdd}
                      setApprovalToAdd={setApprovalToAdd}
                      collectionId={collectionId}
                      distributionType={distributionType}
                      distributionMethod={distributionMethod}
                      increment={increment}
                      startBalances={BalanceArray.From(startBalances)}
                      keyId="useMerkleChallengeLeafIndex"
                      label="Specific codes / whitelisted addresses?"
                    />
                  )}
                  {/* if all are false warning message */}
                  {!orderCalculationMethod.useOverallNumTransfers &&
                    !orderCalculationMethod.usePerToAddressNumTransfers &&
                    !orderCalculationMethod.usePerFromAddressNumTransfers &&
                    !orderCalculationMethod.usePerInitiatedByAddressNumTransfers &&
                    !orderCalculationMethod.useMerkleChallengeLeafIndex && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <WarningOutlined style={{ color: 'red' }} />
                          <span style={{ marginLeft: 8, color: 'red' }}>You must select at least one order calculation method.</span>
                        </div>
                      </div>
                    )}
                </>
              }
            </>
          )}
        </div>
      )}
    </InformationDisplayCard>
  );
};
