import { useEffect, useState } from 'react';

import { BadgeMetadataTimeline, CollectionMetadataTimeline, UintRangeArray } from 'bitbadgesjs-sdk';
import { NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import {
  setCollection,
  updateCollectionAndFetchMetadataDirectly,
  useCollection
} from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { CollectionHeader } from '../../badges/CollectionHeader';
import { DevMode } from '../../common/DevMode';
import { GenericTextFormInput, MultiViewBadgeDisplay } from './MetadataForm';

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
  const collectionId = NEW_COLLECTION_ID;

  const collection = useCollection(collectionId);

  const [collectionUri, setCollectionUri] = useState(collection?.collectionMetadataTimeline?.[0]?.collectionMetadata?.uri);
  const [badgeUri, setBadgeUri] = useState(collection?.badgeMetadataTimeline?.[0]?.badgeMetadata[0]?.uri);
  const [badgeId, setBadgeId] = useState(1n);

  const DELAY_MS = 1000;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select ');
    const delayDebounceFn = setTimeout(async () => {
      if (!collectionUri || !collection) return;

      updateCollectionAndFetchMetadataDirectly(
        {
          collectionId: NEW_COLLECTION_ID,
          cachedCollectionMetadata: undefined,
          collectionMetadataTimeline: collectionUri
            ? [
                new CollectionMetadataTimeline({
                  timelineTimes: UintRangeArray.FullRanges(),
                  collectionMetadata: {
                    uri: collectionUri,
                    customData: ''
                  }
                })
              ]
            : []
        },
        {}
      );
    }, DELAY_MS);

    return () => {
      clearTimeout(delayDebounceFn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionUri]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!badgeUri || !collection) {
        console.log('no badge uri or collection');
        return;
      }

      //Slightly hacky but this will overwrite all cached metadata to [] -> means next badgeavatardisplay render, we fetch since it is empty
      setCollection({
        ...collection,
        cachedBadgeMetadata: [],
        badgeMetadataTimeline: badgeUri
          ? [
              new BadgeMetadataTimeline({
                timelineTimes: UintRangeArray.FullRanges(),
                badgeMetadata: [
                  {
                    uri: badgeUri,
                    badgeIds: [{ start: startId, end: endId }],
                    customData: ''
                  }
                ]
              })
            ]
          : []
      });
    }, DELAY_MS);

    return () => {
      clearTimeout(delayDebounceFn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeUri]);

  return (
    <>
      {!hideCollectionSelect && (
        <>
          <GenericTextFormInput label="Collection Metadata URI" value={collectionUri ?? ''} setValue={setCollectionUri} />
          {collectionUri && <CollectionHeader collectionId={collectionId} />}
        </>
      )}

      {!hideBadgeSelect && (
        <>
          <GenericTextFormInput
            label="Badge Metadata URI"
            value={badgeUri ?? ''}
            setValue={setBadgeUri}
            helper={'"{id}" can be used as a placeholder which will be replaced by the unique ID of each badge.'}
          />

          {(collection?.badgeMetadataTimeline[0]?.badgeMetadata ?? []).length > 0 && (
            <div className="primary-tect full-width">
              <MultiViewBadgeDisplay
                badgeId={badgeId}
                badgeIds={UintRangeArray.From(collection?.badgeMetadataTimeline[0].badgeMetadata.map((b) => b.badgeIds).flat() ?? [])}
                setBadgeId={setBadgeId}
              />
            </div>
          )}

          <DevMode obj={collection?.badgeMetadataTimeline} />
          <DevMode obj={collection?.cachedBadgeMetadata ?? []} />
          <DevMode obj={collection?.cachedCollectionMetadata} />
          <DevMode obj={collection?.collectionMetadataTimeline} />
        </>
      )}
    </>
  );
}
