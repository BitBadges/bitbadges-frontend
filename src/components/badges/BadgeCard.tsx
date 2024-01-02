import { Card, Tooltip } from "antd"
import Meta from "antd/lib/card/Meta"
import {
  DefaultPlaceholderMetadata,
  getBalanceForIdAndTime,
  getMetadataForBadgeId,
  isFullUintRanges,
} from "bitbadgesjs-utils"
import { useRouter } from "next/router"

import { ClockCircleOutlined } from "@ant-design/icons"
import { Balance } from "bitbadgesjs-proto"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import { getTimeRangesString } from "../../utils/dates"
import { BadgeAvatar } from "./BadgeAvatar"

export function BadgeCard({
  size = 100,
  collectionId,
  hoverable,
  badgeId,
  hideCollectionLink,
  showSupplys,
  balances,
}: {
  badgeId: bigint
  collectionId: bigint
  size?: number
  hoverable?: boolean
  hideCollectionLink?: boolean
  showSupplys?: boolean
  balances?: Balance<bigint>[]
}) {
  const router = useRouter()

  const collection = useCollection(collectionId)

  //Calculate total, undistributed, claimable, and distributed supplys

  const maxBadgeId = collection ? getMaxBadgeIdForCollection(collection) : 0n
  const metadata =
    badgeId > maxBadgeId
      ? DefaultPlaceholderMetadata
      : getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])

  const collectionMetadata = collection?.cachedCollectionMetadata

  const currBalanceAmount = badgeId && balances ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), balances) : 0n
  const showOwnershipTimesIcon =
    badgeId && balances && showSupplys
      ? balances.some((x) => !isFullUintRanges(x.ownershipTimes))
      : false

  const isMobile = window.innerWidth < 768

  const oneVW = window.innerWidth / 100
  return (
    <Card
      className="primary-text card-bg card-border rounded-lg"
      style={{
        margin: 8,
        textAlign: "center",
        //we want 2 per row so calc padding based on that (3vw margin, 1vw padding) + 8px margin either side of card
        maxWidth: isMobile ? (window.innerWidth - 32 - 4 * (oneVW * 4)) / 2 : undefined,
      }}
      hoverable={hoverable ? hoverable : true}
      onClick={() => {
        router.push(`/collections/${collectionId}/${badgeId}`)
      }}
      cover={
        <div
          className="flex-center full-width primary-text"
          style={{ marginTop: "1rem" }}
        >
          <BadgeAvatar
            collectionId={collectionId}
            badgeId={badgeId}
            size={size}
            noHover
          />
        </div>
      }
    >
      <div className="flex-center full-width primary-text">
        <Meta
          title={
            <div>
              <div
                className="primary-text xs:text-xs sm:text-sm md:text-md lg:text-lg"
                style={{
                  fontWeight: "bolder",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {metadata?.name}
              </div>
              {!hideCollectionLink && (
                <div
                  className="primary-text"
                  style={{
                    fontWeight: "bolder",
                    fontSize: 14,
                    whiteSpace: "normal",
                  }}
                  onClick={(e) => {
                    router.push(`/collections/${collectionId}`)
                    e.stopPropagation()
                  }}
                >
                  <a className="">{collectionMetadata?.name}</a>
                </div>
              )}
            </div>
          }
          description={
            <div
              className="secondary-text full-width xs:text-xs sm:text-sm md:text-md lg:text-lg"
              style={{
                alignItems: "center",
                justifyContent: "center",

              }}
            >
              {collection && (
                <>
                  ID #{`${badgeId}`}
                  <br />
                </>
              )}
              {showSupplys && (
                <>
                  x
                  <span
                    style={{
                      color: currBalanceAmount < 0 ? "red" : undefined,
                    }}
                  >
                    {`${currBalanceAmount}`}
                  </span>
                </>
              )}
              {showOwnershipTimesIcon && showSupplys && (
                <Tooltip
                  color="black"
                  title={
                    <div>
                      {balances?.map((x, idx) => {
                        return (
                          <>
                            {idx > 0 && <br />}
                            {idx > 0 && <br />}x{x.amount.toString()} from{" "}
                            {getTimeRangesString(x.ownershipTimes, "", true)}
                          </>
                        )
                      })}
                    </div>
                  }
                >
                  <ClockCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              )}
              {showSupplys && <> owned</>}
            </div>
          }
        />
      </div>
    </Card>
  )
}
