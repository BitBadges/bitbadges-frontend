import { CollectionApprovalWithDetails } from "bitbadgesjs-sdk";
import { BalanceDisplay } from "../../balances/BalanceDisplay";

export const MustOwnBadgesCard = ({ approval }: {
  approval: CollectionApprovalWithDetails<bigint>
}) => {
  return <>
    {approval.approvalCriteria?.mustOwnBadges && approval.approvalCriteria?.mustOwnBadges?.length > 0 && (

      <>
        {approval.approvalCriteria?.mustOwnBadges.map((mustOwnBadge, idx) => {
          const approvalCriteria = approval.approvalCriteria;
          if (!approvalCriteria || !approvalCriteria.mustOwnBadges) return null;

          return <div className='flex-center flex-column primary-text' key={idx}>
            <BalanceDisplay
              hideMessage
              message='Amounts'
              mustOwnBadges={approvalCriteria?.mustOwnBadges}
              balances={[]}
              collectionId={mustOwnBadge.collectionId}
              isMustOwnBadgesInput={mustOwnBadge.overrideWithCurrentTime}
            />
          </div>
        })}
      </>
    )}

  </>
}
