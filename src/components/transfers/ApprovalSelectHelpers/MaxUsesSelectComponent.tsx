import { InfoCircleOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Switch, Tooltip, Typography } from 'antd';
import { DistributionMethod } from '../../../bitbadges-api/types';
import { TableRow } from '../../display/TableRow';
import { NumberInput } from '../../inputs/NumberInput';
import { RequiredApprovalProps } from '../ApprovalSelect';
import { approvalCriteriaUsesPredeterminedBalances } from '../../../bitbadges-api/utils/claims';

export const MaxUses = ({
  disabled,
  type,
  approvalToAdd,
  setApprovalToAdd,
  isCodeDisplay,
  isPasswordDisplay,
  setExpectedPartitions,
  distributionMethod
}: {
  type: 'overall' | 'to' | 'initiatedBy' | 'from';
  disabled?: boolean;
  approvalToAdd: RequiredApprovalProps;
  setApprovalToAdd: (approval: RequiredApprovalProps) => void;
  isCodeDisplay?: boolean;
  isPasswordDisplay?: boolean;
  setExpectedPartitions?: (expectedPartitions: bigint) => void;
  distributionMethod: DistributionMethod;
}) => {
  const hasWhitelist = disabled && distributionMethod === DistributionMethod.Whitelist;

  const noun = distributionMethod === DistributionMethod.Claims ? 'Claims' : 'Uses';
  const label =
    type === 'overall'
      ? `Max ${noun}`
      : type === 'to'
        ? `Max ${noun} per To Address`
        : type === 'initiatedBy'
          ? `Max ${noun} per Initiator`
          : `Max ${noun} per From Address`;

  const key =
    type === 'overall'
      ? 'overallMaxNumTransfers'
      : type === 'to'
        ? 'perToAddressMaxNumTransfers'
        : type === 'initiatedBy'
          ? 'perInitiatedByAddressMaxNumTransfers'
          : 'perFromAddressMaxNumTransfers';
  const numUses = approvalToAdd?.approvalCriteria?.maxNumTransfers?.[key] || 0n;
  const setNumUses = (numUses: bigint) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        maxNumTransfers: { ...approvalToAdd.approvalCriteria.maxNumTransfers, [key]: numUses }
      }
    });
  };

  let greaterThanOverall = false;
  if (approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers > 0n) {
    if (type === 'to') {
      greaterThanOverall =
        approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers >
        approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
    } else if (type === 'initiatedBy') {
      greaterThanOverall =
        approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers >
        approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
    } else if (type === 'from') {
      greaterThanOverall =
        approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers >
        approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
    }
  }

  const trackedBehindTheScenes =
    (key === 'overallMaxNumTransfers' &&
      approvalCriteriaUsesPredeterminedBalances(approvalToAdd.approvalCriteria) &&
      approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers &&
      approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) ||
    (key === 'perFromAddressMaxNumTransfers' &&
      approvalCriteriaUsesPredeterminedBalances(approvalToAdd.approvalCriteria) &&
      approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers &&
      approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers === 0n) ||
    (key === 'perInitiatedByAddressMaxNumTransfers' &&
      approvalCriteriaUsesPredeterminedBalances(approvalToAdd.approvalCriteria) &&
      approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers &&
      approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers === 0n) ||
    (key === 'perToAddressMaxNumTransfers' &&
      approvalCriteriaUsesPredeterminedBalances(approvalToAdd.approvalCriteria) &&
      approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers &&
      approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers === 0n);

  const InputNode = (
    <>
      {numUses > 0n && !disabled && (
        <div style={{ justifyContent: 'center', marginTop: 10, marginBottom: 10 }}>
          <NumberInput
            title={isPasswordDisplay ? 'Max Password Uses' : isCodeDisplay ? 'Number of Claims (Codes)' : 'Max Uses'}
            value={Number(numUses)}
            disabled={disabled}
            setValue={(val) => {
              setNumUses(BigInt(val));
              if (setExpectedPartitions) {
                setExpectedPartitions(BigInt(val));
              }
            }}
            min={1}
            max={100000}
          />
        </div>
      )}
      {greaterThanOverall && (
        <div style={{ color: '#FF5733' }}>
          <WarningOutlined /> The per user max uses is greater than the cumulative max uses.
        </div>
      )}
    </>
  );

  const list =
    type === 'overall'
      ? undefined
      : type === 'initiatedBy'
        ? approvalToAdd.initiatedByList
        : type === 'from'
          ? approvalToAdd.fromList
          : approvalToAdd.toList;

  if (isPasswordDisplay || isCodeDisplay) {
    return InputNode;
  }

  return (
    <>
      {' '}
      <TableRow
        labelSpan={16}
        valueSpan={8}
        label={
          <>
            {label}{' '}
            <Tooltip color="black" title="Max uses = the maximum number of times this approval can be used.">
              <InfoCircleOutlined />
            </Tooltip>
          </>
        }
        value={
          <>
            <Switch
              unCheckedChildren="Not Tracked"
              checkedChildren={
                <>
                  {numUses.toString()} {numUses === 1n ? 'Use' : 'Uses'}
                </>
              }
              checked={numUses > 0n}
              onChange={(checked) => {
                setNumUses(checked ? 1n : 0n);
              }}
              disabled={disabled || isCodeDisplay || isPasswordDisplay}
            />
          </>
        }
      />
      {trackedBehindTheScenes && (
        <div style={{ marginLeft: 10, textAlign: 'start' }}>
          <Typography.Text className="secondary-text" style={{ fontSize: 12, textAlign: 'start' }}>
            <InfoCircleOutlined /> Even if no max is set, this value is tracked behind the scenes (due to the selected method of assigning
            partitions).
          </Typography.Text>
          <br />
          <br />
        </div>
      )}
      {disabled && !hasWhitelist && (
        <div className="secondary-text px-2" style={{ textAlign: 'start' }}>
          <LockOutlined /> {type === 'overall' ? 'To edit this, edit the number of claims.' : ''}
          {type !== 'overall' && <>To edit this, edit the number of claims per address.</>}
          <br /> <br />
        </div>
      )}
      {disabled && hasWhitelist && (
        <div className="secondary-text px-2" style={{ textAlign: 'start' }}>
          <LockOutlined /> {type === 'overall' ? 'To edit this, edit the number of whitelisted users.' : ''}
          {type !== 'overall' && <>Locked due to distribution method. One use per whitelist member.</>}
          <br /> <br />
        </div>
      )}
      {/* {numUses == 0n && !hasWhitelist && (
        <div className="secondary-text px-2" style={{ textAlign: 'start' }}>
          <WarningOutlined style={{ color: '#FF5733' }} /> No limit on uses.
        </div>
      )} */}
      {numUses > 0n && !hasWhitelist && !disabled && type !== 'overall' && (
        <div className="secondary-text px-2" style={{ textAlign: 'start' }}>
          <InfoCircleOutlined style={{ color: '#FF5733' }} />{' '}
          {list?.whitelist
            ? `There are potentially ${list.addresses.length} users.`
            : distributionMethod === DistributionMethod.Claims && type === 'initiatedBy'
              ? 'Each unique initiator must provide a valid unused code. This restricts the number of codes used per user.'
              : 'There are potentially an unlimited possible number of users.'}
        </div>
      )}
      {InputNode}
    </>
  );
};
