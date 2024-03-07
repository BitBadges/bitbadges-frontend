import { Form, Spin, Tag, Tooltip, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { BatchBadgeDetailsArray, PaginationInfo, UintRange, UintRangeArray } from 'bitbadgesjs-sdk';

import { filterBadgesInCollection } from '../../bitbadges-api/api';
import { fetchCollectionsWithOptions, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getBadgesWithFrozenMetadata, getBadgesWithFrozenTransferability, getBadgesWithLockedSupply } from '../../bitbadges-api/utils/badges';
import { INFINITE_LOOP_MODE } from '../../constants';
import { compareObjects } from '../../utils/compare';
import { BadgeInfiniteScroll } from '../badges/BadgeInfiniteScroll';
import { BatchBadgeDetailsTag, CollectionsFilterSearchBar } from '../badges/DisplayFilters';
import { Divider } from '../display/Divider';
import { CheckboxSelect, SelectWithOptions } from '../inputs/Selects';
import { AttributesSelect, GenericStringArrFormInput } from '../tx-timelines/form-items/MetadataForm';

const { Text } = Typography;

export function BadgesTab({ collectionId }: { collectionId: bigint }) {
  const [cardView, setCardView] = useState(true);
  const [onlySpecificCollections, setOnlySpecificCollections] = useState<BatchBadgeDetailsArray<bigint>>(new BatchBadgeDetailsArray());
  const [searchValue, setSearchValue] = useState('');
  const collection = useCollection(collectionId);
  const [loading, setLoading] = useState(false);

  const [attributes, setAttributes] = useState<{ name: string; value: string | number | boolean }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [customView, setCustomView] = useState<UintRangeArray<bigint> | undefined>(undefined);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | undefined>('oldest');
  const [sortByMostViewed, setSortByMostViewed] = useState<undefined | 'allTime' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(undefined);

  //These will be true, false, or undefined
  //undefined = do nothin
  //true = filter for true
  //false = filter for false
  const [hasCirculatingSupplyFilter, setHasCirculatingSupplyFilter] = useState<boolean | undefined>(undefined);
  const [canUpdateMetadataFilter, setCanUpdateMetadataFilter] = useState<boolean | undefined>(undefined);
  const [canCreateMoreFilter, setCanCreateMoreFilter] = useState<boolean | undefined>(undefined);
  const [canUpdateTransferabilityFilter, setCanUpdateTransferabilityFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!collectionId) return;

    //Fetch 10 badge metadata uris by default
    //This is done bc in most cases, there will be <10 URIs for a collection
    //So, we would be fetching all metadata for a collection in one go and all suggested stuff would be complete with all existing metadata
    //Else, it is simply a good idea to fetch some metadata to start with
    async function fetchColl() {
      await fetchCollectionsWithOptions([
        {
          collectionId,
          metadataToFetch: {
            metadataIds: [
              {
                start: 1n,
                end: 10n
              }
            ]
          }
        }
      ]);
    }
    fetchColl();
  }, [collectionId, collection]);

  const filteredBadges = useMemo(() => {
    const circulatingBalances = UintRangeArray.From(
      collection
        ?.getBadgeBalances('Total')
        ?.getBalancesForTime(BigInt(Date.now()))
        .map((x) => x.badgeIds)
        .flat() ?? new UintRangeArray<bigint>()
    );

    const badgesWithCirculatingSupply = collection ? circulatingBalances : new UintRangeArray<bigint>();
    const badgesWithLockedSupply = collection ? getBadgesWithLockedSupply(collection, undefined, true, 'always') : new UintRangeArray<bigint>();
    const badgesWithFrozenTransferability = collection ? getBadgesWithFrozenTransferability(collection, 'always') : new UintRangeArray<bigint>();
    const badgesWithFrozenMetadata = collection ? getBadgesWithFrozenMetadata(collection, 'always') : new UintRangeArray<bigint>();

    const badgesWithoutCirculatingSupply = badgesWithCirculatingSupply.toInverted(UintRange.FullRange());
    const badgesWithoutLockedSupply = badgesWithLockedSupply.toInverted(UintRange.FullRange());
    const badgesWithoutFrozenTransferability = badgesWithFrozenTransferability.toInverted(UintRange.FullRange());
    const badgesWithoutFrozenMetadata = badgesWithFrozenMetadata.toInverted(UintRange.FullRange());

    let badgeIds = collection ? collection.getBadgeIdRange() : new UintRangeArray<bigint>();
    if (onlySpecificCollections.length > 0) {
      badgeIds = UintRangeArray.From(onlySpecificCollections.map((x) => x.badgeIds).flat());
    }

    if (hasCirculatingSupplyFilter === true) {
      badgeIds.remove(badgesWithoutCirculatingSupply);
    } else if (hasCirculatingSupplyFilter === false) {
      badgeIds.remove(badgesWithCirculatingSupply);
    }

    if (canUpdateMetadataFilter === true) {
      badgeIds.remove(badgesWithoutFrozenMetadata);
    } else if (canUpdateMetadataFilter === false) {
      badgeIds.remove(badgesWithFrozenMetadata);
    }

    if (canCreateMoreFilter === true) {
      badgeIds.remove(badgesWithoutLockedSupply);
    } else if (canCreateMoreFilter === false) {
      badgeIds.remove(badgesWithLockedSupply);
    }

    if (canUpdateTransferabilityFilter === true) {
      badgeIds.remove(badgesWithoutFrozenTransferability);
    } else if (canUpdateTransferabilityFilter === false) {
      badgeIds.remove(badgesWithFrozenTransferability);
    }

    return badgeIds;
  }, [hasCirculatingSupplyFilter, canUpdateMetadataFilter, canCreateMoreFilter, canUpdateTransferabilityFilter, onlySpecificCollections, collection]);

  const [customViewPagination, setCustomViewPagination] = useState<PaginationInfo | undefined>(undefined);

  useEffect(() => {
    setCustomViewPagination(undefined);
  }, [categories, tags, filteredBadges, sortByMostViewed]);

  const fetchMore = useCallback(async () => {
    if (sortByMostViewed) {
      setLoading(true);
      const filterRes = await filterBadgesInCollection({
        collectionId,
        mostViewed: 'allTime'
      });

      const badgeIdsRes = filterRes.badgeIds.clone();
      const allOtherBadgeIdsWithZeroViews = UintRangeArray.FullRanges().remove(badgeIdsRes);

      setCustomView(UintRangeArray.From([...badgeIdsRes, ...allOtherBadgeIdsWithZeroViews]));
      setCustomViewPagination(filterRes.pagination);
      setLoading(false);
      return;
    }

    //If we are just using onlySpecificCollections or nothing at all, we can do that all client-side
    if (categories.every((x) => !x) && tags.every((x) => !x) && attributes.every((x) => !x.name && !x.value)) {
      setCustomView(undefined);
      return;
    }

    setLoading(true);
    const filterRes = await filterBadgesInCollection({
      collectionId,
      categories,
      tags,
      badgeIds: filteredBadges,
      bookmark: customViewPagination?.bookmark,
      attributes
    });

    setCustomView(filterRes.badgeIds.clone());
    setCustomViewPagination(filterRes.pagination);
    setLoading(false);
  }, [collectionId, categories, filteredBadges, tags, sortByMostViewed, attributes]);

  const DELAY_MS = 600;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: custom filter view ');

    const delayDebounceFn = setTimeout(async () => {
      if (!collectionId) return;

      await fetchMore();
    }, DELAY_MS);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [collectionId, categories, filteredBadges, tags, sortByMostViewed, fetchMore]);

  const FilterSearchDropdown = (
    <CollectionsFilterSearchBar
      specificCollectionId={collectionId}
      onSearch={async (searchValue: any) => {
        if (typeof searchValue === 'string') {
          const collectionId = BigInt(searchValue.split('/')[0]);
          const badgeId = BigInt(searchValue.split('/')[1]);

          setOnlySpecificCollections(
            BatchBadgeDetailsArray.From([...onlySpecificCollections, { collectionId, badgeIds: [{ start: badgeId, end: badgeId }] }])
          );
          setSearchValue('');
        }
      }}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
    />
  );

  const suggestedTags = useMemo(() => {
    return (collection?.cachedBadgeMetadata.map((x) => x.metadata.tags).flat() ?? []).filter((x) => x) as string[];
  }, [collection]);

  const suggestedCategories = useMemo(() => {
    return (collection?.cachedBadgeMetadata.map((x) => x.metadata.category).flat() ?? []).filter((x) => x) as string[];
  }, [collection]);

  return (
    <div className="primary-text full-width">
      <div className="flex-wrap full-width flex" style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', marginTop: 4 }}>
        {!sortByMostViewed && (
          <div
            // Cursor pointer
            className="styled-button-normal rounded cursor-pointer px-2"
            style={{ border: 'none', fontSize: 28 }}
            onClick={() => {
              setShowAdvancedFilters(!showAdvancedFilters);
            }}>
            <Tooltip title={showAdvancedFilters ? 'Hide Additional Filters' : 'Show Additional Filters'}>
              {!showAdvancedFilters ? <FullscreenOutlined /> : <FullscreenExitOutlined />}
            </Tooltip>
          </div>
        )}
        <SelectWithOptions
          title="View"
          value={cardView ? 'card' : 'image'}
          setValue={(e) => {
            setCardView(e === 'card');
          }}
          options={[
            { label: 'Card', value: 'card' },
            { label: 'Image', value: 'image' }
          ]}
        />

        <SelectWithOptions
          title="Sort By"
          value={sortByMostViewed ? 'most-viewed' : sortBy ?? 'oldest'}
          setValue={(e) => {
            setSortBy(e === 'oldest' ? 'oldest' : e === 'newest' ? 'newest' : undefined);
            setSortByMostViewed(e === 'oldest' ? undefined : e === 'newest' ? undefined : 'daily');
          }}
          options={[
            { label: 'Oldest', value: 'oldest' },
            { label: 'Newest', value: 'newest' },
            { label: 'Most Viewed', value: 'most-viewed' }
          ]}
        />

        {sortByMostViewed && (
          <SelectWithOptions
            title="Timeframe"
            value={sortByMostViewed}
            setValue={(e) => {
              setSortByMostViewed(
                e === 'allTime' ? 'allTime' : e === 'daily' ? 'daily' : e === 'weekly' ? 'weekly' : e === 'monthly' ? 'monthly' : 'yearly'
              );
            }}
            options={[
              { label: 'All Time', value: 'allTime' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' }
            ]}
          />
        )}

        <div style={{ marginBottom: 4, flexGrow: 1 }}>{FilterSearchDropdown}</div>
      </div>

      {onlySpecificCollections.length > 0 && !sortByMostViewed && (
        <>
          <br />
          <div className="full-width flex-center flex-wrap">
            {onlySpecificCollections.map((filteredCollection, idx) => {
              return (
                <BatchBadgeDetailsTag
                  key={idx}
                  badgeIdObj={filteredCollection}
                  onClose={() => {
                    setOnlySpecificCollections(onlySpecificCollections.filter((x) => !compareObjects(x, filteredCollection)));
                  }}
                />
              );
            })}
          </div>
        </>
      )}
      {showAdvancedFilters && !sortByMostViewed && (
        <>
          <Form colon={false} layout="vertical" style={{ textAlign: 'start' }}>
            <br />
            <TagsSelect tags={tags} setTags={setTags} suggestedTags={suggestedTags} />
            <CategoriesSelect categories={categories} setCategories={setCategories} suggestedCategories={suggestedCategories} />
            <AttributesSelect attributes={attributes} setAttributes={setAttributes} />
          </Form>
          <div className="">
            <CheckboxSelect
              title="Currently Circulating?"
              value={hasCirculatingSupplyFilter}
              setValue={setHasCirculatingSupplyFilter}
              options={[
                { label: 'No', value: false },
                { label: 'Yes', value: true }
              ]}
            />
            <CheckboxSelect
              title="Frozen Metadata?"
              value={canUpdateMetadataFilter}
              setValue={setCanUpdateMetadataFilter}
              options={[
                { label: 'No', value: false },
                { label: 'Yes', value: true }
              ]}
            />
            <CheckboxSelect
              title="Locked Supply?"
              value={canCreateMoreFilter}
              setValue={setCanCreateMoreFilter}
              options={[
                { label: 'No', value: false },
                { label: 'Yes', value: true }
              ]}
            />
            <CheckboxSelect
              title="Frozen Transferability?"
              value={canUpdateTransferabilityFilter}
              setValue={setCanUpdateTransferabilityFilter}
              options={[
                { label: 'No', value: false },
                { label: 'Yes', value: true }
              ]}
            />
          </div>
          <br />
          <hr />
        </>
      )}

      <br />
      {loading && (
        <>
          <div className="flex-center flex-wrap">
            <Spin size="large" />
          </div>
          <Divider />
        </>
      )}
      <div className="flex-center flex-wrap full-width">
        <BadgeInfiniteScroll
          cardView={cardView}
          badgesToShow={BatchBadgeDetailsArray.From<bigint>(
            customView
              ? [
                  {
                    collectionId,
                    badgeIds: customView
                  }
                ]
              : collection
                ? [
                    {
                      collectionId,
                      badgeIds: filteredBadges
                    }
                  ]
                : []
          )}
          hasMore={customView ? customViewPagination?.hasMore ?? true : false}
          fetchMore={async () => {
            if (!customView) return;
            await fetchMore();
          }}
          groupByCollection={false}
          editMode={false}
          addressOrUsername=""
          sortBy={sortByMostViewed ? undefined : sortBy}
        />
      </div>
    </div>
  );
}

export const CategoriesSelect = ({
  categories,
  setCategories,
  suggestedCategories
}: {
  categories: string[];
  setCategories: (categories: string[]) => void;
  suggestedCategories: string[];
}) => {
  return (
    <GenericStringArrFormInput
      label="Categories"
      value={categories}
      setValue={setCategories}
      helper={
        <div style={{ fontSize: 12 }}>
          <Text className="secondary-text" style={{ textAlign: 'start', alignItems: 'center', marginTop: 4 }}>
            *Separate with a comma (case sensitive).
            <br />
            {categories.length === 0 && suggestedCategories.length > 0 && <div style={{ marginLeft: 4, marginRight: 4 }}>Suggested:</div>}
            {(categories.length === 0 ? suggestedCategories : categories).map((tag: any, idx: number) => {
              if (!tag) return;
              return (
                <Tag key={tag + idx} className="card-bg secondary-text" style={{ margin: 2 }}>
                  {tag}
                </Tag>
              );
            })}
          </Text>
        </div>
      }
    />
  );
};

export const TagsSelect = ({ tags, setTags, suggestedTags }: { tags: string[]; setTags: (tags: string[]) => void; suggestedTags: string[] }) => {
  return (
    <GenericStringArrFormInput
      label="Tags / Keywords"
      value={tags}
      setValue={setTags}
      helper={
        <div style={{ fontSize: 12 }}>
          <Text className="secondary-text" style={{ textAlign: 'start', alignItems: 'center', marginTop: 4 }}>
            *Separate with a comma (case sensitive).
            <br />
            {tags.length === 0 && suggestedTags.length > 0 && <div style={{ marginLeft: 4, marginRight: 4 }}>Suggested:</div>}
            {(tags.length === 0 ? suggestedTags : tags).map((tag: any, idx: number) => {
              if (!tag) return;
              return (
                <Tag key={tag + idx} className="card-bg secondary-text" style={{ margin: 2 }}>
                  {tag}
                </Tag>
              );
            })}
          </Text>
        </div>
      }
    />
  );
};
