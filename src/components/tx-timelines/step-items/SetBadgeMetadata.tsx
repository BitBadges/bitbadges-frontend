import {
  MetadataAddMethod,
  getMaxBadgeIdForCollection
} from "bitbadgesjs-sdk"
import { useState } from "react"
import {
  EmptyStepItem,
  NEW_COLLECTION_ID,
  useTxTimelineContext,
} from "../../../bitbadges-api/contexts/TxTimelineContext"

import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext"
import { getBadgesWithUpdatableMetadata } from "../../../bitbadges-api/utils/badges"
import { MetadataForm } from "../form-items/MetadataForm"
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper"
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay"

export function SetBadgeMetadataStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID)
  const txTimelineContext = useTxTimelineContext()
  const startingCollection = txTimelineContext.startingCollection
  const canUpdateBadgeMetadata = txTimelineContext.updateBadgeMetadataTimeline
  const setUpdateBadgeMetadata =
    txTimelineContext.setUpdateBadgeMetadataTimeline
  const addMethod = txTimelineContext.badgeAddMethod
  const setAddMethod = txTimelineContext.setBadgeAddMethod

  const [err, setErr] = useState<Error | null>(null)

  if (!collection) return EmptyStepItem

  const toUpdateBadges = getBadgesWithUpdatableMetadata(
    collection,
    startingCollection,
    undefined,
    'current'
  )

  return {
    title: "Set Badge Metadata",
    description: <>Customize each individual badge in the collection.</>,
    node: () => (
      <UpdateSelectWrapper
        doNotUpdateNode={() => {
          return <BadgeAvatarDisplay collectionId={NEW_COLLECTION_ID} badgeIds={[{ start: 1n, end: getMaxBadgeIdForCollection(collection) }]} />
        }}
        documentationLink={
          "https://docs.bitbadges.io/overview/how-it-works/metadata"
        }
        err={err}
        setErr={(err) => {
          setErr(err)
        }}
        updateFlag={canUpdateBadgeMetadata}
        setUpdateFlag={setUpdateBadgeMetadata}
        jsonPropertyPath="badgeMetadataTimeline"
        permissionName="canUpdateBadgeMetadata"
        disableJson
        node={() => (
          <div>
            {collection && (
              <>
                <MetadataForm
                  badgeIds={toUpdateBadges}
                  addMethod={addMethod}
                  setAddMethod={setAddMethod}
                />
              </>
            )}
          </div>
        )}
      />
    ),
    disabled:
      !collection ||
      (addMethod === MetadataAddMethod.Manual &&
        collection.cachedBadgeMetadata.length == 0) ||
      (addMethod === MetadataAddMethod.UploadUrl &&
        (collection.badgeMetadataTimeline.length == 0)) ||
      !!err,
  }
}
