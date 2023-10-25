import { WarningOutlined } from "@ant-design/icons";
import { Switch } from "antd";
import { ReactNode } from "react";
import { BalanceDisplay } from "../../badges/balances/BalanceDisplay";
import { TableRow } from "../../display/TableRow";
import { NumberInput } from "../../inputs/NumberInput";
import { RequiredApprovalProps } from "../ApprovalSelect";

export const ApprovalAmounts = ({ label, disabled, type, approvalToAdd, setApprovalToAdd, collectionId }: {
  type: 'overall' | 'to' | 'initiatedBy' | 'from', label: ReactNode, disabled?: boolean,
  approvalToAdd: RequiredApprovalProps, setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
  collectionId: bigint
}) => {
  const key = type === 'overall' ? 'overallApprovalAmount' : type === 'to' ? 'perToAddressApprovalAmount' : type === 'initiatedBy' ? 'perInitiatedByAddressApprovalAmount' : 'perFromAddressApprovalAmount';
  const approvedAmount = approvalToAdd?.approvalCriteria?.approvalAmounts?.[key] || 0n;
  const setApprovedAmount = (approvedAmount: bigint) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        approvalAmounts: {
          ...approvalToAdd.approvalCriteria.approvalAmounts,
          [key]: approvedAmount,
        }
      }
    });
  }

  let greaterThanOverall = false;
  if (approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount > 0n) {
    if (type === 'to') {
      greaterThanOverall = approvalToAdd.approvalCriteria.approvalAmounts.perToAddressApprovalAmount > approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount;
    } else if (type === 'initiatedBy') {
      greaterThanOverall = approvalToAdd.approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount > approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount;
    } else if (type === 'from') {
      greaterThanOverall = approvalToAdd.approvalCriteria.approvalAmounts.perFromAddressApprovalAmount > approvalToAdd.approvalCriteria.approvalAmounts.overallApprovalAmount;
    }
  }

  return <> <TableRow labelSpan={16} valueSpan={8} label={label} value={<>
    <Switch
      checked={approvedAmount > 0n}
      onChange={(checked) => {
        setApprovedAmount(checked ? 1n : 0n);
      }}
      disabled={disabled}
    />

  </>
  } />
    {approvedAmount > 0n && <div style={{ justifyContent: 'center', marginTop: 10, marginBottom: 10 }}>
      <NumberInput

        title='Max Amount Approved'
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

        hideMessage collectionId={collectionId}
        balances={[{ amount: approvedAmount, badgeIds: approvalToAdd.badgeIds, ownershipTimes: approvalToAdd.ownershipTimes }]} />
    </div>}

    {greaterThanOverall && <div style={{ color: 'orange' }}>
      <WarningOutlined /> The selected max amount is greater than the cumulative max amount.
    </div>}
  </>
}