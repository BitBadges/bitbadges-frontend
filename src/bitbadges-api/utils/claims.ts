import { NumberType } from "bitbadgesjs-proto";
import { ApprovalDetailsWithDetails } from "bitbadgesjs-utils";

export function approvalDetailsUsesPredeterminedBalances(approvalDetails?: ApprovalDetailsWithDetails<NumberType>) {
  if (!approvalDetails) {
    return false;
  }

  return (approvalDetails.predeterminedBalances.incrementedBalances.startBalances.length > 0
    || approvalDetails.predeterminedBalances.manualBalances.length > 0);
}

export function approvalDetailsHasNoRestrictions(approvalDetails?: ApprovalDetailsWithDetails<NumberType>) {
  return (!approvalDetails || (
    approvalDetails.mustOwnBadges.length == 0 &&
    approvalDetails.approvalAmounts.overallApprovalAmount == 0n &&
    approvalDetails.approvalAmounts.perFromAddressApprovalAmount == 0n &&
    approvalDetails.approvalAmounts.perInitiatedByAddressApprovalAmount == 0n &&
    approvalDetails.approvalAmounts.perToAddressApprovalAmount == 0n &&
    approvalDetails.maxNumTransfers.overallMaxNumTransfers == 0n &&
    approvalDetails.maxNumTransfers.perFromAddressMaxNumTransfers == 0n &&
    approvalDetails.maxNumTransfers.perInitiatedByAddressMaxNumTransfers == 0n &&
    approvalDetails.maxNumTransfers.perToAddressMaxNumTransfers == 0n &&
    approvalDetails.predeterminedBalances.incrementedBalances.startBalances.length == 0 &&
    approvalDetails.predeterminedBalances.manualBalances.length == 0 &&
    !approvalDetails.requireFromDoesNotEqualInitiatedBy &&
    !approvalDetails.requireFromEqualsInitiatedBy &&
    !approvalDetails.requireToDoesNotEqualInitiatedBy &&
    !approvalDetails.requireToEqualsInitiatedBy &&
    !approvalDetails.overridesFromApprovedOutgoingTransfers &&
    !approvalDetails.overridesToApprovedIncomingTransfers &&
    !approvalDetails.merkleChallenge.root &&
    !approvalDetails.merkleChallenge.uri &&
    !approvalDetails.merkleChallenge.customData
  ))
}