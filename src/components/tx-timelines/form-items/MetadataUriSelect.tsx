import { Form, Input, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { DefaultPlaceholderMetadata } from "bitbadgesjs-utils";
import { FOREVER_DATE } from "../../../utils/dates";

const { Text } = Typography;

export function MetadataUriSelect({
  collectionId,

  startId,
  endId,
  hideCollectionSelect,
  hideBadgeSelect
}: {
  collectionId: bigint,
  startId: bigint;
  endId: bigint;
  hideCollectionSelect?: boolean;
  hideBadgeSelect?: boolean;
}) {
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);
  const collection = collections.collections[collectionId.toString()]

  const [collectionUri, setCollectionUri] = useState(collection?.collectionMetadataTimeline && collection.collectionMetadataTimeline[0]?.collectionMetadata?.uri);
  const [badgeUri, setBadgeUri] = useState(collection?.badgeMetadataTimeline && collection.badgeMetadataTimeline[0]?.badgeMetadata[0]?.uri);

  //Upon initial load, populate with placeholder
  useEffect(() => {
    const collection = collectionsRef.current.collections[collectionId.toString()];
    if (!collection) return;

    collectionsRef.current.updateCollection({
      ...collection,
      collectionMetadata: DefaultPlaceholderMetadata,
      badgeMetadata: collection?.badgeMetadata.map(badge => ({
        ...badge,
        metadata: DefaultPlaceholderMetadata
      })) || []
    })
  }, [collectionId])


  const DELAY_MS = 1000;
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!collectionUri || !collection) return

      collectionsRef.current.updateCollection({
        ...collection,
        collectionMetadataTimeline: [{
          timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
          collectionMetadata: {
            uri: collectionUri,
            customData: '',
          }
        }]
      })

    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionUri])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!collectionUri || !badgeUri || !collection) return

      collectionsRef.current.updateCollection({
        ...collection,
        badgeMetadataTimeline: [{
          timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
          badgeMetadata: [{
            uri: badgeUri,
            badgeIds: [{ start: startId, end: endId }],
            customData: '',
          }]
        }],
      })
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeUri])


  return <>
    {!hideCollectionSelect && <>
      <Form.Item
        label={
          <Text
            className='primary-text'
            strong
          >
            Collection Metadata URI
          </Text>
        }
        required
      >
        <Input
          value={collectionUri}
          onChange={(e: any) => {
            setCollectionUri(e.target.value);
          }}
          className='primary-text primary-blue-bg'
        />
      </Form.Item>

      {
        <CollectionHeader collectionId={collectionId} />
      }
    </>
    }

    {!hideBadgeSelect && <>
      <Form.Item
        label={
          <Text
            className='primary-text'
            strong
          >
            Badge Metadata URI
          </Text>
        }
        required
      >
        <Input
          value={badgeUri}
          onChange={(e: any) => {
            setBadgeUri(e.target.value);
          }}
          className='primary-text primary-blue-bg'
        />
        <div style={{ fontSize: 12 }}>
          <Text style={{ color: 'lightgray' }}>
            {"\"{id}\""} can be used as a placeholder which will be replaced the unique ID of each badge.
          </Text>
        </div>
      </Form.Item>



      {collection?.badgeMetadataTimeline[0].badgeMetadata[0] &&
        <div className='flex-center primary-tect full-width'>
          <BadgeAvatarDisplay
            badgeIds={collection?.badgeMetadataTimeline[0].badgeMetadata[0].badgeIds}
            collectionId={collectionId}
            showIds
          />
        </div>
      }
    </>}
  </>
}