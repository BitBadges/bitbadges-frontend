import { iApprovalAmounts, iApprovalCriteriaWithDetails, iMaxNumTransfers } from 'bitbadgesjs-sdk';

export function approvalCriteriaUsesPredeterminedBalances(approvalCriteria?: iApprovalCriteriaWithDetails<bigint>) {
  if (!approvalCriteria?.predeterminedBalances) {
    return false;
  }

  return (
    approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
    approvalCriteria.predeterminedBalances.manualBalances.length > 0
  );
}

export function approvalCriteriaHasNoAmountRestrictions(approvalCriteria?: iApprovalCriteriaWithDetails<bigint>) {
  if (!approvalCriteria) return true;

  return (
    !approvalHasApprovalAmounts(approvalCriteria.approvalAmounts) &&
    !approvalHasMaxNumTransfers(approvalCriteria.maxNumTransfers) &&
    !approvalCriteriaUsesPredeterminedBalances(approvalCriteria)
  );
}

export function approvalCriteriaHasNoAdditionalRestrictions(
  approvalCriteria?: iApprovalCriteriaWithDetails<bigint>,
  allowMintOverrides?: boolean,
  allowToOverrides?: boolean
) {
  return (
    !approvalCriteria ||
    (!approvalCriteria.requireFromDoesNotEqualInitiatedBy &&
      !approvalCriteria.requireFromDoesNotEqualInitiatedBy &&
      !approvalCriteria.requireToDoesNotEqualInitiatedBy &&
      !approvalCriteria.requireToDoesNotEqualInitiatedBy &&
      (allowMintOverrides || !approvalCriteria.overridesFromOutgoingApprovals) &&
      (allowToOverrides || !approvalCriteria.overridesToIncomingApprovals) &&
      !approvalCriteria.merkleChallenge?.root)
  );
}

export const approvalHasApprovalAmounts = (approvalAmounts?: iApprovalAmounts<bigint>) => {
  if (!approvalAmounts) return false;

  return (
    approvalAmounts?.overallApprovalAmount > 0n ||
    approvalAmounts?.perFromAddressApprovalAmount > 0n ||
    approvalAmounts?.perToAddressApprovalAmount > 0n ||
    approvalAmounts?.perInitiatedByAddressApprovalAmount > 0n
  );
};

export const approvalHasMaxNumTransfers = (maxNumTransfers?: iMaxNumTransfers<bigint>) => {
  if (!maxNumTransfers) return false;

  return (
    maxNumTransfers?.overallMaxNumTransfers > 0n ||
    maxNumTransfers?.perFromAddressMaxNumTransfers > 0n ||
    maxNumTransfers?.perToAddressMaxNumTransfers > 0n ||
    maxNumTransfers?.perInitiatedByAddressMaxNumTransfers > 0n
  );
};
