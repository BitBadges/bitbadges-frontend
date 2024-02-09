import { Col, Row } from "antd"
import {
  getCurrentValuesForCollection,
  getUintRangesForAllBadgeIdsInCollection,
} from "bitbadgesjs-sdk"

import { getMaxBadgeIdForCollection } from "bitbadgesjs-sdk"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay"
import { DistributionOverview } from "../badges/DistributionCard"
import { MetadataDisplay } from "../badges/MetadataInfoDisplay"
import { InformationDisplayCard } from "../display/InformationDisplayCard"
import { BalanceChecker } from "./OwnersTab"
import { PermissionsOverview } from "./PermissionsInfo"

export function OverviewTab({
  collectionId,
  setTab,
}: {
  collectionId: bigint
  setTab: (tab: string) => void
}) {
  const collection = useCollection(collectionId)

  if (!collection) return <></>

  const noBalancesStandard = collection && getCurrentValuesForCollection(collection).standards.includes("No User Ownership")
  const MetadataDisplayElem = <MetadataDisplay collectionId={collectionId} span={24} />

  return (
    <>
      <div>
        <InformationDisplayCard title="Badges">
          <BadgeAvatarDisplay
            showIds
            size={75}
            collectionId={collectionId}
            badgeIds={getUintRangesForAllBadgeIdsInCollection(collection)}
            maxWidth={"100%"}
            showPageJumper={getMaxBadgeIdForCollection(collection) > 100}
          />
        </InformationDisplayCard>
      </div>
      <Row
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Col
          md={12}
          sm={24}
          xs={24}
        >
          {!noBalancesStandard && MetadataDisplayElem}

          <PermissionsOverview collectionId={collectionId} span={24} />
        </Col>

        <Col
          md={12}
          sm={24}
          xs={24}
        >
          {noBalancesStandard && MetadataDisplayElem}
          {!noBalancesStandard && (
            <>
              <DistributionOverview collectionId={collectionId} span={24} />
              <BalanceChecker collectionId={collectionId} setTab={setTab} />
            </>
          )}
        </Col>
      </Row>
    </>
  )
}
