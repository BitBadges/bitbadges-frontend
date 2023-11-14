import { CollectionApprovalWithDetails } from "bitbadgesjs-utils";
import { CodesDisplay } from "./CodesPasswordsDisplay";

export function ClaimDisplay({
  approval,
  collectionId,
  isCodeDisplay,
  codes,
  claimPassword,
}: {
  approval: CollectionApprovalWithDetails<bigint>,
  collectionId: bigint,
  isCodeDisplay?: boolean
  codes?: string[]
  claimPassword?: string
}) {
  return <>
    {
      isCodeDisplay && <CodesDisplay
        approval={approval}
        collectionId={collectionId}
        codes={codes}
        claimPassword={claimPassword}
      />
    }
  </ >
}