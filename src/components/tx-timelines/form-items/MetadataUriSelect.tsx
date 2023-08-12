import { Form, Input, Typography } from "antd";
import { useEffect, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { FOREVER_DATE } from "../../../utils/dates";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { CollectionHeader } from "../../badges/CollectionHeader";

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

  const collection = collections.collections[collectionId.toString()]

  const [collectionUri, setCollectionUri] = useState(collection?.collectionMetadataTimeline && collection.collectionMetadataTimeline[0]?.collectionMetadata?.uri);
  const [badgeUri, setBadgeUri] = useState(collection?.badgeMetadataTimeline && collection.badgeMetadataTimeline[0]?.badgeMetadata[0]?.uri);

  //Upon initial load, populate with placeholder
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, initial load');
    const collection = collections.collections[collectionId.toString()];
    if (!collection) return;

    // collections.updateCollection({
    //   ...collection,
    //   cachedCollectionMetadata: DefaultPlaceholderMetadata,
    //   cachedBadgeMetadata: collection?.cachedBadgeMetadata.map(badge => ({
    //     ...badge,
    //     metadata: DefaultPlaceholderMetadata
    //   })) || []
    // })

    if (collectionUri) {
      collections.fetchAndUpdateMetadata(collectionId, {
        // badgeIds: [{ start: startId, end: endId }],
      }, true)
    }


  }, [collectionId])


  const DELAY_MS = 1000;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select ');
    const delayDebounceFn = setTimeout(async () => {
      if (!collectionUri || !collection) return

      collections.updateCollection({
        ...collection,
        cachedCollectionMetadata: undefined,
        collectionMetadataTimeline: [{
          timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
          collectionMetadata: {
            uri: collectionUri,
            customData: '',
          }
        }]
      })

      collections.fetchAndUpdateMetadata(collectionId, {

      }, true)

    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionUri])

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!badgeUri || !collection) {
        console.log("no badge uri or collection")
        return
      }

      collections.updateCollection({
        ...collection,
        cachedBadgeMetadata: [],
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

      {collectionUri &&
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



      {(collection?.badgeMetadataTimeline[0]?.badgeMetadata ?? []).length > 0 &&
        <div className='flex-center primary-tect full-width'>
          <BadgeAvatarDisplay
            badgeIds={(collection?.badgeMetadataTimeline[0].badgeMetadata.map(b => b.badgeIds).flat() ?? [])}
            collectionId={collectionId}
            showIds
            fetchDirectly


          />
        </div>
      }
    </>}
  </>
}