import { InfoCircleOutlined } from "@ant-design/icons"
import { CollectionApprovalWithDetails } from "bitbadgesjs-utils"
import { useState } from "react"
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext"
import { approvalCriteriaUsesPredeterminedBalances } from "../../../bitbadges-api/utils/claims"
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay"
import { InformationDisplayCard } from "../../display/InformationDisplayCard"
import { RadioGroup } from "../../inputs/Selects"
import { BalanceOverview } from "../BalancesInfo"
import { PredeterminedCard } from "./PredeterminedCard"

export const ApprovalBalancesCard = ({
  approval,
  collectionId,
  address,
  setAddress,
}: {
  approval: CollectionApprovalWithDetails<bigint>
  collectionId: bigint,
  address: string,
  setAddress: (address: string) => void
}) => {
  const collection = useCollection(collectionId);
  const hasPredetermined = approvalCriteriaUsesPredeterminedBalances(approval.approvalCriteria);
  const [balanceTab, setBalanceTab] = useState(hasPredetermined ? 'current' : 'remaining');

  return < InformationDisplayCard inheritBg noBorder title='Balances' md={12} xs={24} sm={24} >
    <RadioGroup value={balanceTab} onChange={(e) => setBalanceTab(e)}
      options={[
        hasPredetermined ? { label: 'Badges to Receive', value: 'current' } : undefined,
        { label: 'Sender Balances', value: 'remaining' },
        { label: 'All Badges', value: 'all' },
      ]}
    />
    <br /><br />
    {
      balanceTab === 'all' && collection && <>
        <div className='flex-center'>
          <BadgeAvatarDisplay
            collectionId={collectionId}
            badgeIds={approval.badgeIds}
            filterGreaterThanMax
            showIds
          />

        </div>
      </>
    }
    {
      balanceTab === 'remaining' && <>
        {approval.fromMapping.addresses.length > 1 || !approval.fromMapping.includeAddresses ? <>
          <div className='secondary-text'>
            <InfoCircleOutlined /> There are multiple addresses approved as senders.
          </div>
          <br />
        </> : <></>}
        <BalanceOverview
          collectionId={collectionId}
          hideSelect={approval.fromMapping?.addresses.length === 1 && approval.fromMapping.includeAddresses}
          defaultAddress={approval.fromMapping?.addresses.length >= 1 && approval.fromMapping.includeAddresses ? approval.fromMapping?.addresses[0] : undefined}

        />
      </>
    }
    {
      balanceTab === 'current' && <>
        {hasPredetermined && <>
          <PredeterminedCard
            transfer={approval}
            collectionId={collectionId}
            address={address}
            setAddress={setAddress}
          />
        </>}

      </>
    }

  </InformationDisplayCard >

}