import { Col, Row } from "antd"
import {
  getCurrentValuesForCollection,
  getUintRangesForAllBadgeIdsInCollection,
} from "bitbadgesjs-utils"

import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay"
import { DistributionOverview } from "../badges/DistributionCard"
import { MetadataDisplay } from "../badges/MetadataInfoDisplay"
import { InformationDisplayCard } from "../display/InformationDisplayCard"
import { BalanceOverview } from "./BalancesInfo"
import { PermissionsOverview } from "./PermissionsInfo"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"

export function OverviewTab({
  collectionId,
  setTab,
}: {
  collectionId: bigint
  setTab: (tab: string) => void
}) {
  const collection = useCollection(collectionId)

  if (!collection) return <></>

  const noBalancesStandard =
    collection &&
    getCurrentValuesForCollection(collection).standards.includes("No Balances")
  const MetadataDisplayElem = (
    <>
      <MetadataDisplay collectionId={collectionId} span={24} />
      <br />
    </>
  )
  return (
    <>
      {
        <>
          <div style={{ paddingRight: 4, paddingLeft: 4 }}>
            <InformationDisplayCard title="Badges">
              <BadgeAvatarDisplay
                showIds
                size={75}
                collectionId={collectionId}
                badgeIds={getUintRangesForAllBadgeIdsInCollection(collection)}
                maxWidth={"100%"}
                showPageJumper={getMaxBadgeIdForCollection(collection) > 100}
              // doNotAdaptToWidth
              />
            </InformationDisplayCard>
          </div>
          <br />
        </>
      }

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
          style={{ paddingRight: 4, paddingLeft: 4 }}
        >
          {!noBalancesStandard && MetadataDisplayElem}

          <PermissionsOverview collectionId={collectionId} span={24} />
        </Col>

        <Col
          md={12}
          sm={24}
          xs={24}
          style={{ paddingRight: 4, paddingLeft: 4 }}
        >
          <Col md={0} sm={24} xs={24} style={{ height: 20 }} />
          {noBalancesStandard && MetadataDisplayElem}
          {!noBalancesStandard && (
            <>
              <DistributionOverview collectionId={collectionId} span={24} />
              <br />
              <InformationDisplayCard title={<>Balance Checker</>} span={24}>
                <div className="flex">
                  <BalanceOverview
                    collectionId={collectionId}
                    setTab={setTab}
                  />
                </div>
              </InformationDisplayCard>
            </>
          )}
        </Col>
      </Row>
    </>
  )
}
