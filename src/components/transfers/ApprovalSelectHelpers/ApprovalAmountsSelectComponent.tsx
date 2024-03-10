import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { ReactNode } from 'react';
import { BalanceDisplay } from '../../balances/BalanceDisplay';
import { TableRow } from '../../display/TableRow';
import { NumberInput } from '../../inputs/NumberInput';
import { RequiredApprovalProps } from '../ApprovalSelect';
import { BalanceArray } from 'bitbadgesjs-sdk';
import { DistributionMethod } from '../../../bitbadges-api/types';

export const ApprovalAmounts = ({
  label,
  disabled,
  type,
  approvalToAdd,
  setApprovalToAdd,
  collectionId,
  distributionMethod
}: {
  type: 'overall' | 'to' | 'initiatedBy' | 'from';
  label: ReactNode;
  disabled?: boolean;
  approvalToAdd: RequiredApprovalProps;
  setApprovalToAdd: (approval: RequiredApprovalProps) => void;
  collectionId: bigint;
  distributionMethod: DistributionMethod;
}) => {
  const hasWhitelist = disabled && distributionMethod === DistributionMethod.Whitelist;
  const list =
    type === 'overall'
      ? undefined
      : type === 'initiatedBy'
        ? approvalToAdd.initiatedByList
        : type === 'from'
          ? approvalToAdd.fromList
          : approvalToAdd.toList;

  const key =
    type === 'overall'
      ? 'overallApprovalAmount'
      : type === 'to'
        ? 'perToAddressApprovalAmount'
        : type === 'initiatedBy'
          ? 'perInitiatedByAddressApprovalAmount'
          : 'perFromAddressApprovalAmount';
  const approvedAmount = approvalToAdd?.approvalCriteria?.approvalAmounts?.[key] || 0n;
  const setApprovedAmount = (approvedAmount: bigint) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        approvalAmounts: {
          ...approvalToAdd.approvalCriteria.approvalAmounts,
          [key]: approvedAmount
        }
      }
    });
  };

  let greaterThanOverall = false;
  if (approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount > 0n) {
    if (type === 'to') {
      greaterThanOverall =
        approvalToAdd.approvalCriteria.approvalAmounts.perToAddressApprovalAmount >
        approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount;
    } else if (type === 'initiatedBy') {
      greaterThanOverall =
        approvalToAdd.approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount >
        approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount;
    } else if (type === 'from') {
      greaterThanOverall =
        approvalToAdd.approvalCriteria.approvalAmounts.perFromAddressApprovalAmount >
        approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount;
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
              checked={approvedAmount > 0n}
              onChange={(checked) => {
                setApprovedAmount(checked ? 1n : 0n);
              }}
              disabled={disabled}
            />
          </>
        }
      />
      {/* {approvedAmount == 0n && !hasWhitelist && (
        <div className="secondary-text px-2" style={{ textAlign: 'start' }}>
          <WarningOutlined style={{ color: '#FF5733' }} /> No limit on uses.
        </div>
      )} */}
      {approvedAmount > 0n && !hasWhitelist && !disabled && type !== 'overall' && (
        <div className="secondary-text px-2" style={{ textAlign: 'start' }}>
          <InfoCircleOutlined style={{ color: '#FF5733' }} />{' '}
          {list?.whitelist
            ? `There are potentially ${list.addresses.length} users.`
            : distributionMethod === DistributionMethod.Claims
              ? 'Each unique initiator must have a valid unused code. This restricts the number of codes used per user.'
              : 'There are potentially an unlimited number of users because you have selected a blacklist.'}
        </div>
      )}
      {approvedAmount > 0n && (
        <div style={{ justifyContent: 'center', marginTop: 10, marginBottom: 10 }}>
          <NumberInput
            title="Max Amount Approved"
            value={Number(approvedAmount)}
            disabled={disabled}
            setValue={(val) => {
              setApprovedAmount(BigInt(val));
            }}
            min={1}
            max={100000}
          />
          <BalanceDisplay
            hideBadges
            hideMessage
            collectionId={collectionId}
            balances={BalanceArray.From([
              {
                amount: approvedAmount,
                badgeIds: approvalToAdd.badgeIds,
                ownershipTimes: approvalToAdd.ownershipTimes
              }
            ])}
          />
        </div>
      )}

      {greaterThanOverall && (
        <div style={{ color: '#FF5733' }}>
          <WarningOutlined /> The selected max amount is greater than the cumulative max amount.
        </div>
      )}
    </>
  );
};
