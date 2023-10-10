import { NumberType } from "bitbadgesjs-proto";
import { ApprovalCriteriaWithDetails } from "bitbadgesjs-utils";

export function approvalCriteriaUsesPredeterminedBalances(approvalCriteria?: ApprovalCriteriaWithDetails<NumberType>) {
  if (!approvalCriteria || !approvalCriteria.predeterminedBalances) {
    return false;
  }

  return (approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length > 0
    || approvalCriteria.predeterminedBalances.manualBalances.length > 0);
}

export function approvalCriteriaHasNoRestrictions(approvalCriteria?: ApprovalCriteriaWithDetails<NumberType>) {
  return (!approvalCriteria || (
    approvalCriteria.mustOwnBadges &&
    approvalCriteria.mustOwnBadges.length == 0 &&
    approvalCriteria.approvalAmounts &&
    approvalCriteria.approvalAmounts.overallApprovalAmount == 0n &&
    approvalCriteria.approvalAmounts.perFromAddressApprovalAmount == 0n &&
    approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount == 0n &&
    approvalCriteria.approvalAmounts.perToAddressApprovalAmount == 0n &&
    approvalCriteria.maxNumTransfers &&
    approvalCriteria.maxNumTransfers.overallMaxNumTransfers == 0n &&
    approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers == 0n &&
    approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers == 0n &&
    approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers == 0n &&
    approvalCriteria.predeterminedBalances &&
    approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length == 0 &&
    approvalCriteria.predeterminedBalances.manualBalances.length == 0 &&
    !approvalCriteria.requireFromDoesNotEqualInitiatedBy &&
    !approvalCriteria.requireFromEqualsInitiatedBy &&
    !approvalCriteria.requireToDoesNotEqualInitiatedBy &&
    !approvalCriteria.requireToEqualsInitiatedBy &&
    !approvalCriteria.overridesFromOutgoingApprovals &&
    !approvalCriteria.overridesToIncomingApprovals &&
    approvalCriteria.merkleChallenge &&
    !approvalCriteria.merkleChallenge.root &&
    !approvalCriteria.merkleChallenge.uri &&
    !approvalCriteria.merkleChallenge.customData
  ))
}