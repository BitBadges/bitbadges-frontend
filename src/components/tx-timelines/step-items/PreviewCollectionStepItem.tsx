import { InputNumber } from "antd";
import { Numberify, getMaxBadgeIdForCollection } from "bitbadgesjs-sdk";
import { useState } from "react";
import { NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import CollectionPage from "../../../pages/collections/[collectionId]";
import BadgePage from "../../../pages/collections/[collectionId]/[badgeId]";

export function PreviewCollectionStepItem() {
  return {
    title: 'Collection Page Preview',
    description: `Please confirm all collection details are correct. Below is a preview of what the collection page will look like.`,
    node: () => <div>
      <CollectionPage collectionPreview />
    </div>
  }
}

export function PreviewBadgePagesStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID)
  const maxBadgeId = collection ? getMaxBadgeIdForCollection(collection) : 1n
  const [badgeId, setBadgeId] = useState<bigint>(1n)


  return {
    title: 'Badge Pages Preview',
    description: `Please confirm all badge details are correct. Below is a preview of what each badge page will look like.`,
    node: () => <div>
      <br />
      <div className="primary-text flex-center">
        <div>
          <b style={{ fontSize: 18 }}>
            Page for Badge ID{" "}
          </b>
        </div>
        <InputNumber min={1}
          max={
            maxBadgeId > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Numberify(maxBadgeId.toString())
          }
          value={Numberify(badgeId.toString())}
          onChange={(e) => {
            if (!e) return
            setBadgeId(BigInt(e))
          }}
          style={{
            marginLeft: 8,
          }}
          className="primary-text inherit-bg"
        />
      </div>
      <br />

      <BadgePage collectionPreview badgeIdOverride={badgeId} />
    </div>
  }
}