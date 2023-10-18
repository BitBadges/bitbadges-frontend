import { ApprovalAmounts, MaxNumTransfers, NumberType } from "bitbadgesjs-proto";
import { ApprovalCriteriaWithDetails } from "bitbadgesjs-utils";

export function approvalCriteriaUsesPredeterminedBalances(approvalCriteria?: ApprovalCriteriaWithDetails<NumberType>) {
  if (!approvalCriteria || !approvalCriteria.predeterminedBalances) {
    return false;
  }

  return (approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length > 0
    || approvalCriteria.predeterminedBalances.manualBalances.length > 0);
}
export function approvalCriteriaHasNoAmountRestrictions(approvalCriteria?: ApprovalCriteriaWithDetails<NumberType>) {
  return (
    !approvalCriteria ||
    (!approvalCriteria.approvalAmounts || (
      approvalCriteria.approvalAmounts.overallApprovalAmount == 0n &&
      approvalCriteria.approvalAmounts.perFromAddressApprovalAmount == 0n &&
      approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount == 0n &&
      approvalCriteria.approvalAmounts.perToAddressApprovalAmount == 0n
    )) &&
    (!approvalCriteria.maxNumTransfers || (
      approvalCriteria.maxNumTransfers.overallMaxNumTransfers == 0n &&
      approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers == 0n &&
      approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers == 0n &&
      approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers == 0n
    )) &&
    (!approvalCriteria.predeterminedBalances || (
      approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length == 0 &&
      approvalCriteria.predeterminedBalances.manualBalances.length == 0
    ))
  );
}


export function approvalCriteriaHasNoAdditionalRestrictions(approvalCriteria?: ApprovalCriteriaWithDetails<NumberType>, allowMintOverrides?: boolean) {
  return (!approvalCriteria || (
    !approvalCriteria.requireFromDoesNotEqualInitiatedBy
    && !approvalCriteria.requireFromDoesNotEqualInitiatedBy
    && !approvalCriteria.requireToDoesNotEqualInitiatedBy
    && !approvalCriteria.requireToDoesNotEqualInitiatedBy
    && (allowMintOverrides || !approvalCriteria.overridesFromOutgoingApprovals)
    && !approvalCriteria.overridesToIncomingApprovals
    && !approvalCriteria.merkleChallenge?.root
  ))
}

export const approvalHasApprovalAmounts = (approvalAmounts?: ApprovalAmounts<bigint>) => {
  if (!approvalAmounts) return false;

  return approvalAmounts?.overallApprovalAmount > 0n ||
    approvalAmounts?.perFromAddressApprovalAmount > 0n ||
    approvalAmounts?.perToAddressApprovalAmount > 0n ||
    approvalAmounts?.perInitiatedByAddressApprovalAmount > 0n;
}

export const approvalHasMaxNumTransfers = (maxNumTransfers?: MaxNumTransfers<bigint>) => {
  if (!maxNumTransfers) return false;

  return maxNumTransfers?.overallMaxNumTransfers > 0n ||
    maxNumTransfers?.perFromAddressMaxNumTransfers > 0n ||
    maxNumTransfers?.perToAddressMaxNumTransfers > 0n ||
    maxNumTransfers?.perInitiatedByAddressMaxNumTransfers > 0n;
}
