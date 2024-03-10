import { InfoCircleOutlined } from '@ant-design/icons';
import { Switch, Typography } from 'antd';
import { BalanceArray } from 'bitbadgesjs-sdk';
import { DistributionMethod } from '../../../bitbadges-api/types';
import { BalanceDisplay } from '../../balances/BalanceDisplay';
import { TableRow } from '../../display/TableRow';
import { BalanceAmountInput } from '../../inputs/BalanceAmountInput';
import { RequiredApprovalProps, getMaxIncrementsApplied } from '../ApprovalSelect';
import { MaxUses } from './MaxUsesSelectComponent';

export const OrderCalculationMethod = ({
  approvalToAdd,
  setApprovalToAdd,
  distributionMethod,
  increment,
  startBalances,
  collectionId,
  expectedPartitions,
  keyId,
  label
}: {
  expectedPartitions: bigint;
  distributionMethod: DistributionMethod;
  increment: bigint;
  startBalances: BalanceArray<bigint>;
  collectionId: bigint;
  setApprovalToAdd: (approval: RequiredApprovalProps) => void;
  approvalToAdd: RequiredApprovalProps;
  label: string;
  keyId:
    | 'useOverallNumTransfers'
    | 'usePerToAddressNumTransfers'
    | 'usePerFromAddressNumTransfers'
    | 'usePerInitiatedByAddressNumTransfers'
    | 'useMerkleChallengeLeafIndex';
}) => {
  const checked = approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod?.[keyId] || false;
  const setChecked = (checked: boolean) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        predeterminedBalances: {
          ...approvalToAdd.approvalCriteria.predeterminedBalances,
          orderCalculationMethod: {
            ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
            useMerkleChallengeLeafIndex: false,
            useOverallNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            usePerToAddressNumTransfers: false,
            [keyId]: checked
          }
        }
      }
    });
  };

  const somethingElseChecked = Object.entries(approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod || {}).some(
    ([key, val]) => key !== keyId && val === true
  );
  if (somethingElseChecked) return <></>;

  const maxIncrementsApplied = getMaxIncrementsApplied(approvalToAdd);

  let maxUsesErrorMessage = '';
  if (
    (keyId === 'useMerkleChallengeLeafIndex' || keyId === 'useOverallNumTransfers') &&
    approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n
  ) {
    maxUsesErrorMessage = 'To calculate number of increments, you must set an overall max uses.';
  } else if (
    keyId === 'usePerFromAddressNumTransfers' &&
    approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers === 0n &&
    approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n
  ) {
    maxUsesErrorMessage = 'To calculate number of increments, you must set overall max uses or max uses per sender.';
  } else if (
    keyId === 'usePerInitiatedByAddressNumTransfers' &&
    approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers === 0n &&
    approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n
  ) {
    maxUsesErrorMessage = 'To calculate number of increments, you must set overall max uses or max uses per approver.';
  } else if (
    keyId === 'usePerToAddressNumTransfers' &&
    approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers === 0n &&
    approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n
  ) {
    maxUsesErrorMessage = 'To calculate number of increments, you must set overall max uses or max uses per recipient.';
  } else if (maxIncrementsApplied !== expectedPartitions) {
    maxUsesErrorMessage = `Expected ${expectedPartitions} increments but got ${maxIncrementsApplied}`;
    if (distributionMethod === DistributionMethod.Claims) {
      if (keyId === 'useOverallNumTransfers') {
        maxUsesErrorMessage += ` (i.e. ${maxIncrementsApplied} claims allowed total and increment once per claim).`;
      } else {
        maxUsesErrorMessage += ` (i.e. ${maxIncrementsApplied} claims allowed per user and increment once per such claim).`;
      }
    }
  }

  return (
    <>
      <TableRow
        labelSpan={16}
        valueSpan={8}
        label={label}
        value={
          <>
            <Switch
              disabled={
                keyId === 'useMerkleChallengeLeafIndex' &&
                distributionMethod !== DistributionMethod.Claims &&
                distributionMethod !== DistributionMethod.Whitelist
              }
              checked={checked}
              onChange={(checked) => {
                setChecked(checked);
              }}
            />
          </>
        }
      />
      {
        <div style={{ textAlign: 'start', marginLeft: 10, marginBottom: 10 }}>
          <Typography.Text className="secondary-text" style={{ fontSize: 12, textAlign: 'start' }}>
            <InfoCircleOutlined />
            {keyId == 'useOverallNumTransfers'
              ? ' First use of this approval by any user will be assigned increment #1, second use of this approval increment #2, and so on regardless of who sends, receives, or initiates. Each increment will only ever be approved once.'
              : ''}
            {keyId == 'usePerFromAddressNumTransfers'
              ? ' Each unique sender will be assigned increment #1 upon first use of this approval, increment #2 upon second use, and so on. Each increment will be approved more than once (if there are multiple senders).'
              : ''}
            {keyId == 'usePerInitiatedByAddressNumTransfers'
              ? ' Each unique approver will be assigned increment #1 upon first use of this approval, increment #2 upon second use, and so on. Each increment will be approved more than once (if there are multiple approved addresses).'
              : ''}
            {keyId == 'usePerToAddressNumTransfers'
              ? ' Each unique recipient will be assigned increment #1 upon first use of this approval, increment #2 upon second use, and so on. Each increment will be approved more than once (if there are multiple recipients).'
              : ''}
            {keyId == 'useMerkleChallengeLeafIndex'
              ? distributionMethod === DistributionMethod.Whitelist
                ? ' Reserve specific increments for specific whitelisted users.'
                : distributionMethod === DistributionMethod.Claims
                  ? ' Reserve specific increments for specific claims.'
                  : ' Reserve specific increments for specific users / codes.'
              : ''}
          </Typography.Text>
        </div>
      }
      {checked && (
        <>
          <br />
          {
            <div>
              {maxUsesErrorMessage && <div style={{ color: 'red' }}>{maxUsesErrorMessage}</div>}
              {!maxUsesErrorMessage && (
                <Typography.Text className="primary-text" strong style={{ fontSize: 16 }}>
                  Total Increments: {maxIncrementsApplied.toString()}
                </Typography.Text>
              )}
            </div>
          }

          <br />

          <MaxUses
            approvalToAdd={approvalToAdd}
            setApprovalToAdd={setApprovalToAdd}
            type="overall"
            distributionMethod={distributionMethod}
            disabled={distributionMethod === DistributionMethod.Claims || distributionMethod === DistributionMethod.Whitelist}
          />

          {!(approvalToAdd.initiatedByList.addresses.length <= 1 && approvalToAdd.initiatedByList.whitelist) && (
            <MaxUses
              approvalToAdd={approvalToAdd}
              setApprovalToAdd={setApprovalToAdd}
              type="initiatedBy"
              distributionMethod={distributionMethod}
              disabled={distributionMethod === DistributionMethod.Claims || distributionMethod === DistributionMethod.Whitelist}
            />
          )}
          {!approvalToAdd.approvalCriteria.requireFromEqualsInitiatedBy &&
            !(approvalToAdd.fromList.addresses.length <= 1 && approvalToAdd.fromList.whitelist) && (
              <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} distributionMethod={distributionMethod} type="from" />
            )}
          {!approvalToAdd.approvalCriteria.requireToEqualsInitiatedBy &&
            !(approvalToAdd.toList.addresses.length <= 1 && approvalToAdd.toList.whitelist) && (
              <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} distributionMethod={distributionMethod} type="to" />
            )}
          <br />

          {maxIncrementsApplied > 0n && !maxUsesErrorMessage && (
            <>
              {approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers ||
              approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers ||
              approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers ? (
                <>
                  <Typography.Text style={{ textAlign: 'center' }} className="secondary-text">
                    <InfoCircleOutlined style={{ marginRight: 5, color: '#FF5733' }} />
                    You have selected to increment the amount per specific user (not overall), so the approved balances depend on how many times each
                    user uses the approval. Below is the balances for a <b>single user</b> if they use the maximum number of times.
                  </Typography.Text>
                  <br />
                </>
              ) : (
                <></>
              )}
              {(increment ? increment : 0) > 0 && (
                <div style={{ textAlign: 'center', margin: 10 }}>
                  <div className="flex-center">
                    <div style={{ textAlign: 'center', margin: 10 }}>
                      <BalanceAmountInput
                        title={'Amount per Transfer'}
                        balances={startBalances}
                        setBalances={(balances) => {
                          setApprovalToAdd({
                            ...approvalToAdd,
                            approvalCriteria: {
                              ...approvalToAdd.approvalCriteria,
                              predeterminedBalances: {
                                ...approvalToAdd.approvalCriteria.predeterminedBalances,
                                incrementedBalances: {
                                  ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                                  startBalances: balances
                                }
                              }
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <br />
              <BalanceDisplay
                message={'Approved Badges - All Increments'}
                hideMessage
                collectionId={collectionId}
                balances={startBalances}
                incrementBadgeIdsBy={increment}
                numIncrements={maxIncrementsApplied}
              />
            </>
          )}
        </>
      )}
    </>
  );
};
