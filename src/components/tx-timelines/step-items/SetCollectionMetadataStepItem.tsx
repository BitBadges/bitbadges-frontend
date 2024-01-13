import { MetadataAddMethod } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getBadgesWithUpdatableMetadata } from "../../../bitbadges-api/utils/badges";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function SetCollectionMetadataStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
  const collectionMetadata = collection?.cachedCollectionMetadata;
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const canUpdateCollectionMetadata = txTimelineContext.updateCollectionMetadataTimeline;
  const setCanUpdateCollectionMetadata = txTimelineContext.setUpdateCollectionMetadataTimeline;
  const addMethod = txTimelineContext.collectionAddMethod;
  const setAddMethod = txTimelineContext.setCollectionAddMethod;

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem

  const toUpdateBadges = getBadgesWithUpdatableMetadata(collection, startingCollection, undefined, 'current');

  return {
    title: 'Set Collection Metadata',
    description: <>{'Provide details about the collection you are creating.'}
    </>,

    node: () => <UpdateSelectWrapper
      doNotUpdateNode={() => {
        return <><CollectionHeader multiDisplay collectionId={NEW_COLLECTION_ID} hideCollectionLink />
        </>
      }}
      documentationLink="https://docs.bitbadges.io/overview/how-it-works/metadata"
      err={err}
      updateFlag={canUpdateCollectionMetadata}
      setUpdateFlag={setCanUpdateCollectionMetadata}
      setErr={(err) => { setErr(err) }}
      jsonPropertyPath='collectionMetadataTimeline'
      permissionName='canUpdateCollectionMetadata'
      disableJson
      node={() => <div>{
        collection && <div>
          <MetadataForm
            isCollectionSelect
            badgeIds={toUpdateBadges}
            addMethod={addMethod}
            setAddMethod={setAddMethod}
          />
        </div>
      }</div>
      }
    />,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
      || (addMethod === MetadataAddMethod.UploadUrl && ((collection.collectionMetadataTimeline.length == 0)
      ))
      || !!err,
  }
}