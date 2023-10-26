import { InfoCircleOutlined, LockOutlined, WarningOutlined } from "@ant-design/icons";
import { Tooltip, Switch, Typography } from "antd";
import { DistributionMethod } from "bitbadgesjs-utils";
import { ReactNode } from "react";
import { TableRow } from "../../display/TableRow";
import { NumberInput } from "../../inputs/NumberInput";
import { RequiredApprovalProps, AmountType, CodeType } from "../ApprovalSelect";

export const MaxUses = ({ label, disabled, type,
  approvalToAdd, setApprovalToAdd, amountType, codeType, distributionMethod,
  isCodeDisplay,
  isPasswordDisplay,
}: {
  type: 'overall' | 'to' | 'initiatedBy' | 'from', label: ReactNode, disabled?: boolean
  approvalToAdd: RequiredApprovalProps, setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
  amountType: AmountType, codeType: CodeType, distributionMethod: DistributionMethod,
  isCodeDisplay?: boolean, isPasswordDisplay?: boolean
}) => {
  const key = type === 'overall' ? 'overallMaxNumTransfers' : type === 'to' ? 'perToAddressMaxNumTransfers' : type === 'initiatedBy' ? 'perInitiatedByAddressMaxNumTransfers' : 'perFromAddressMaxNumTransfers';
  const numUses = approvalToAdd?.approvalCriteria?.maxNumTransfers?.[key] || 0n;
  const setNumUses = (numUses: bigint) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        maxNumTransfers: {
          ...approvalToAdd.approvalCriteria.maxNumTransfers,
          [key]: numUses,
        }
      }
    });
  }

  let greaterThanOverall = false;
  if (approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers > 0n) {
    if (type === 'to') {
      greaterThanOverall = approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers > approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
    } else if (type === 'initiatedBy') {
      greaterThanOverall = approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers > approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
    } else if (type === 'from') {
      greaterThanOverall = approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers > approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
    }
  }

  const trackedBehindTheScenes =
    (key === 'overallMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) ||
    (key === 'perFromAddressMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers === 0n) ||
    (key === 'perInitiatedByAddressMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers === 0n) ||
    (key === 'perToAddressMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers === 0n)
  return <> <TableRow labelSpan={16} valueSpan={8} label={<>
    {label} <Tooltip color='black' title="Max uses = the maximum number of times this approval can be used.">
      <InfoCircleOutlined />
    </Tooltip>

  </>} value={<>
    <Switch
      checked={numUses > 0n}
      onChange={(checked) => {
        setNumUses(checked ? 1n : 0n);
      }}
      disabled={disabled || isCodeDisplay || isPasswordDisplay}
    />
  </>
  } />
    {trackedBehindTheScenes && <div style={{ marginLeft: 10, textAlign: 'start' }}>
      <Typography.Text className='text-gray-400' style={{ fontSize: 12, textAlign: 'start' }}>
        <InfoCircleOutlined /> Even if no max is set, this value is tracked behind the scenes (due to the selected method of assigning partitions).
      </Typography.Text>
      <br /><br />
    </div>}
    {numUses > 0n && <div style={{ justifyContent: 'center', marginTop: 10, marginBottom: 10 }}>
      <NumberInput
        title='Max Uses'
        value={Number(numUses)}
        disabled={disabled}
        setValue={(val) => {
          setNumUses(BigInt(val));
        }}
        min={1}
        max={100000}
      />
      <br />
      {disabled && <div style={{ marginLeft: 10 }}>

        <LockOutlined /> {type === 'overall' ? 'To edit this, edit the number of ' + (codeType === CodeType.Unique ? 'codes.' : 'password uses.') : ''}
        {type !== 'overall' && <>
          Locked due to distribution method: {distributionMethod === DistributionMethod.Codes ?
            codeType === CodeType.Unique ? 'Codes' : 'Password' : distributionMethod}
        </>}
      </div>}
      {isCodeDisplay && <div style={{ marginLeft: 10 }}>

        {"This is the number of codes that will be generated."}
      </div>}
      {isPasswordDisplay && <div style={{ marginLeft: 10 }}>

        {"This is the number of uses for the password."}
      </div>}
    </div>}
    {greaterThanOverall && <div style={{ color: 'orange' }}>
      <WarningOutlined /> The selected max uses is greater than the cumulative max uses.
    </div>}
  </>
}
