import { Form, Input, Typography } from "antd";
import { useEffect, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { DevMode } from "../../common/DevMode";
import { NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";

const { Text } = Typography;

export function MetadataUriSelect({
  startId,
  endId,
  hideCollectionSelect,
  hideBadgeSelect
}: {
  startId: bigint;
  endId: bigint;
  hideCollectionSelect?: boolean;
  hideBadgeSelect?: boolean;
}) {
  const collections = useCollectionsContext();
  const collectionId = NEW_COLLECTION_ID;

  const collection = collections.getCollection(collectionId);

  const [collectionUri, setCollectionUri] = useState(collection?.collectionMetadataTimeline && collection.collectionMetadataTimeline[0]?.collectionMetadata?.uri);
  const [badgeUri, setBadgeUri] = useState(collection?.badgeMetadataTimeline && collection.badgeMetadataTimeline[0]?.badgeMetadata[0]?.uri);

  const DELAY_MS = 1000;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select ');
    const delayDebounceFn = setTimeout(async () => {
      if (!collectionUri || !collection) return

      collections.updateCollectionAndFetchMetadataDirectly({
        collectionId: NEW_COLLECTION_ID,
        cachedCollectionMetadata: undefined,
        collectionMetadataTimeline: collectionUri ? [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          collectionMetadata: {
            uri: collectionUri,
            customData: '',
          }
        }] : []
      }, {}, true)

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

      //Slightly hacky but this will overwrite all cached metadata to [] -> means next badgeavatardisplay render, we fetch since it is empty
      collections.setCollection({
        ...collection,
        cachedBadgeMetadata: [],
        badgeMetadataTimeline: badgeUri ? [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          badgeMetadata: [{
            uri: badgeUri,
            badgeIds: [{ start: startId, end: endId }],
            customData: '',
          }]
        }] : [],
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
          className='primary-text inherit-bg'
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
          className='primary-text inherit-bg'
        />
        <div style={{ fontSize: 12 }}>
          <Text style={{ color: 'lightgray' }}>
            {"\"{id}\""} can be used as a placeholder which will be replaced by the unique ID of each badge.
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

      <DevMode obj={collection?.badgeMetadataTimeline} />
      <DevMode obj={collection?.cachedBadgeMetadata ?? []} />
      <DevMode obj={collection?.cachedCollectionMetadata} />
      <DevMode obj={collection?.collectionMetadataTimeline} />
    </>}
  </>
}