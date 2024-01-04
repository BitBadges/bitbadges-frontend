import { Checkbox, Form, Input, Spin, Tag, Tooltip, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { FullscreenExitOutlined, FullscreenOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PaginationInfo, getCurrentValueForTimeline, getMaxBadgeIdForCollection, getMaxMetadataId, getUintRangesForAllBadgeIdsInCollection, invertUintRanges, removeUintRangeFromUintRange } from 'bitbadgesjs-utils';

import { BigIntify, UintRange, convertUintRange, deepCopy } from 'bitbadgesjs-proto';
import { filterBadgesInCollection } from '../../bitbadges-api/api';
import { fetchCollectionsWithOptions, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { BadgeInfiniteScroll, BatchBadgeDetailsTag, CollectionsFilterSearchBar } from '../../pages/account/[addressOrUsername]';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { Divider } from '../display/Divider';
import { getBadgesWithFrozenMetadata, getBadgesWithFrozenTransferability, getBadgesWithLockedSupply } from '../tx-timelines/step-items/CanUpdateMetadata';

const { Text } = Typography;



export const SelectWithOptions = ({
  title,
  value,
  setValue,
  options,
}: {
  title: string;
  value: string | undefined;
  setValue: (value: string | undefined) => void;
  options: {
    disabled?: boolean;
    disabledReason?: string;
    label: string;
    value: string | undefined;
  }[];
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="primary-text flex-bet" style={{ margin: 4, }}>
      <div>
        <b className="text-md">{title}</b>
        <div className="mt-2 relative">
          <div className="relative inline-block w-full">
            <div className="relative z-10">
              <button
                data-dropdown-toggle={"dropdown" + title}
                type="button"
                className="styled-button-normal rounded-lg w-full py-2 px-4 text-center cursor-pointer border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                style={{ borderWidth: 1, fontWeight: 'bold' }}
                onClick={() => setOpen(!open)}
              >
                {value ? (
                  options.find((option) => option.value === value)?.label
                ) : (
                  <span className="text-gray-400">Select an option</span>
                )}
              </button>
            </div>
            {open &&
              <div id={"dropdown" + title} className="full-width absolute z-20">
                {(
                  <ul className="absolute z-20 mt-2  bg-white shadow-lg rounded py-1" id={"dropdown" + title}>
                    {options.map((option, idx) => (
                      <li
                        key={idx}
                        style={{ width: '100%' }}
                        className={`${option.disabled
                          ? 'text-red-500 cursor-not-allowed'
                          : 'text-black hover:bg-blue-200 cursor-pointer'
                          } px-4 py-2`}
                        onClick={() => {
                          if (!option.disabled) {
                            setValue(option.value);
                            setOpen(false);
                          }
                        }}
                      >
                        <Tooltip title={option.disabledReason ?? option.label}>
                          {option.label}
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                )}
              </div>}
          </div>
        </div>
      </div>
    </div >
  );
};



export function BadgesTab({ collectionId }: {
  collectionId: bigint
}) {
  const [cardView, setCardView] = useState(true);
  const [filteredCollections, setFilteredCollections] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const collection = useCollection(collectionId)
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [customView, setCustomView] = useState<UintRange<bigint>[] | undefined>(undefined);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | undefined>('oldest');
  const [sortByMostViewed, setSortByMostViewed] = useState<undefined | 'allTime' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(undefined);

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
      await fetchCollectionsWithOptions([{
        collectionId,
        metadataToFetch: {
          metadataIds: [{
            start: 1n, end: getMaxMetadataId(getCurrentValueForTimeline(collection?.badgeMetadataTimeline ?? [])?.badgeMetadata ?? [])
          }]
        }
      }]);

    }
    fetchColl();
  }, [collectionId, collection]);


  const filteredBadges = useMemo(() => {
    const badgesWithCirculatingSupply = collection ? [{ start: 1n, end: getMaxBadgeIdForCollection(collection) }] : [];
    const badgesWithLockedSupply = collection ? getBadgesWithLockedSupply(collection, undefined, true) : [];
    const badgesWithFrozenTransferability = collection ? getBadgesWithFrozenTransferability(collection) : [];
    const badgesWithFrozenMetadata = collection ? getBadgesWithFrozenMetadata(collection) : [];

    const badgesWithoutCirculatingSupply = invertUintRanges(badgesWithCirculatingSupply, 1n, GO_MAX_UINT_64);
    const badgesWithoutLockedSupply = invertUintRanges(badgesWithLockedSupply, 1n, GO_MAX_UINT_64);
    const badgesWithoutFrozenTransferability = invertUintRanges(badgesWithFrozenTransferability, 1n, GO_MAX_UINT_64);
    const badgesWithoutFrozenMetadata = invertUintRanges(badgesWithFrozenMetadata, 1n, GO_MAX_UINT_64);


    let badgeIds = collection ? getUintRangesForAllBadgeIdsInCollection(collection) : [];
    if (filteredCollections.length > 0) {
      badgeIds = filteredCollections.map(x => x.badgeIds).flat();
    }

    if (hasCirculatingSupplyFilter === true) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithoutCirculatingSupply, badgeIds);
      badgeIds = remaining;
    } else if (hasCirculatingSupplyFilter === false) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithCirculatingSupply, badgeIds);
      badgeIds = remaining;
    }

    if (canUpdateMetadataFilter === true) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithoutFrozenMetadata, badgeIds);
      badgeIds = remaining;
    } else if (canUpdateMetadataFilter === false) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithFrozenMetadata, badgeIds);
      badgeIds = remaining;
    }

    if (canCreateMoreFilter === true) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithoutLockedSupply, badgeIds);
      badgeIds = remaining;
    } else if (canCreateMoreFilter === false) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithLockedSupply, badgeIds);
      badgeIds = remaining;
    }

    if (canUpdateTransferabilityFilter === true) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithoutFrozenTransferability, badgeIds);
      badgeIds = remaining;
    } else if (canUpdateTransferabilityFilter === false) {
      const [remaining] = removeUintRangeFromUintRange(badgesWithFrozenTransferability, badgeIds);
      badgeIds = remaining;
    }

    return badgeIds;
  }, [hasCirculatingSupplyFilter, canUpdateMetadataFilter, canCreateMoreFilter, canUpdateTransferabilityFilter, filteredCollections, collection]);

  const [customViewPagination, setCustomViewPagination] = useState<PaginationInfo | undefined>(undefined);

  useEffect(() => {
    setCustomViewPagination(undefined);
  }, [categories, tags, filteredBadges, sortByMostViewed]);

  const fetchMore = useCallback(async () => {
    if (sortByMostViewed) {
      setLoading(true);
      const filterRes = await filterBadgesInCollection({
        collectionId,
        mostViewed: 'allTime',

      });

      const badgeIdsRes = filterRes.badgeIds.map(x => convertUintRange(x, BigIntify))

      const [allOtherBadgeIdsWithZeroViews] = removeUintRangeFromUintRange(deepCopy(badgeIdsRes), [{ start: 1n, end: GO_MAX_UINT_64 }]);


      setCustomView([...badgeIdsRes, ...allOtherBadgeIdsWithZeroViews.map(x => convertUintRange(x, BigIntify))]);
      setCustomViewPagination(filterRes.pagination)
      setLoading(false);
      return;
    }


    //If we are just using filteredCollections or nothing at all, we can do that all client-side
    if (categories.length == 0 && tags.length == 0) {
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
    });

    setCustomView(filterRes.badgeIds.map(x => convertUintRange(x, BigIntify)));
    setCustomViewPagination(filterRes.pagination)
    setLoading(false);
  }, [collectionId, categories, filteredBadges, tags, sortByMostViewed]);


  const DELAY_MS = 600;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: custom filter view ');

    const delayDebounceFn = setTimeout(async () => {
      if (!collectionId) return;

      await fetchMore();
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [collectionId, categories, filteredBadges, tags, sortByMostViewed, fetchMore]);

  const FilterSearchDropdown = <CollectionsFilterSearchBar
    specificCollectionId={collectionId}
    onSearch={async (searchValue: any, _isAccount?: boolean | undefined, _isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
      if (typeof searchValue === 'string') {
        if (isBadge) {
          const collectionId = BigInt(searchValue.split('/')[0]);
          const badgeId = BigInt(searchValue.split('/')[1]);

          setFilteredCollections([...filteredCollections, {
            collectionId,
            badgeIds: [{ start: badgeId, end: badgeId }]
          }]);
        }

        setSearchValue('');
      }
    }} searchValue={searchValue} setSearchValue={setSearchValue} />




  const suggestedTags = useMemo(() => {
    return (collection?.cachedBadgeMetadata.map(x => x.metadata.tags).flat() ?? []).filter(x => x);
  }, [collection]);

  const suggestedCategories = useMemo(() => {
    return (collection?.cachedBadgeMetadata.map(x => x.metadata.category).flat() ?? []).filter(x => x);
  }, [collection]);

  const BadgeRadioFilter = ({
    title,
    value,
    setValue,
    options,
  }: {
    title: string,
    value: boolean | undefined,
    setValue: (value: boolean | undefined) => void,
    options: {
      label: string,
      value: boolean | undefined
    }[]
  }) => {
    return <div className='flex' style={{ marginRight: 8, textAlign: 'start' }}>
      <div style={{ width: 200 }}>
        <b>{title}</b>
      </div>
      {options.map((option, idx) => {
        return <Checkbox
          className='primary-text'
          checked={value === option.value}
          onChange={(e) => {
            if (e.target.checked) {
              setValue(option.value);
            } else {
              setValue(undefined);
            }
          }}
          style={{ marginLeft: 8 }}
          key={idx}>
          {option.label}
        </Checkbox>
      }
      )
      }
    </div>
  }




  return (
    <div className='primary-text full-width'>
      <div
        className="flex-wrap full-width flex"
        style={{ flexDirection: "row-reverse", alignItems: "flex-end", marginTop: 4 }}
      >



        {!sortByMostViewed && <div
          // Cursor pointer
          className="styled-button-normal rounded cursor-pointer px-2"
          style={{ border: 'none', fontSize: 28 }}
          onClick={() => { setShowAdvancedFilters(!showAdvancedFilters) }}
        >
          <Tooltip title={showAdvancedFilters ? 'Hide Additional Filters' : 'Show Additional Filters'}>
            {!showAdvancedFilters ? <FullscreenOutlined /> : <FullscreenExitOutlined />}
          </Tooltip>
        </div>}
        <SelectWithOptions title='View' value={cardView ? 'card' : 'image'} setValue={(e) => {
          setCardView(e === 'card');
        }} options={[{ label: 'Card', value: 'card' }, { label: 'Image', value: 'image' },]} />

        <SelectWithOptions title='Sort By' value={sortByMostViewed ? 'most-viewed' : sortBy ?? 'oldest'} setValue={(e) => {
          setSortBy(e === 'oldest' ? 'oldest' : e === 'newest' ? 'newest' : undefined)
          setSortByMostViewed(e === 'oldest' ? undefined : e === 'newest' ? undefined : 'daily')
        }} options={[{ label: 'Oldest', value: 'oldest' }, { label: 'Newest', value: 'newest' }, { label: 'Most Viewed', value: 'most-viewed' },]} />

        {sortByMostViewed &&
          <SelectWithOptions title='Timeframe' value={sortByMostViewed} setValue={(e) => {
            setSortByMostViewed(e === 'allTime' ? 'allTime' : e === 'daily' ? 'daily' : e === 'weekly' ? 'weekly' : e === 'monthly' ? 'monthly' : 'yearly')
          }} options={[{ label: 'All Time', value: 'allTime' }, { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }, { label: 'Yearly', value: 'yearly' },]} />
        }
        {(
          <div style={{ marginBottom: 4, flexGrow: 1 }}> {/* Add this style to make it grow */}
            {FilterSearchDropdown}
          </div>
        )}
      </div>

      {
        filteredCollections.length > 0 && !sortByMostViewed && <>
          <br />
          <div className='full-width flex-center flex-wrap'>
            {filteredCollections.map((filteredCollection, idx) => {
              return <BatchBadgeDetailsTag key={idx} badgeIdObj={filteredCollection} onClose={() => {
                setFilteredCollections(filteredCollections.filter(x => !compareObjects(x, filteredCollection)));
              }} />
            })}
          </div>
        </>
      }
      {
        showAdvancedFilters && !sortByMostViewed && <>
          <Form colon={false} layout="vertical" style={{ textAlign: 'start' }}>


            <br />
            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Tags / Keywords / Attributes{" "}
                  <Tooltip
                    color="black"
                    title={
                      "Use tags and keywords to further categorize your badge and make it more searchable!"
                    }
                  >
                    <InfoCircleOutlined />
                  </Tooltip>
                </Text>
              }
            >
              <div className="flex-between" style={{}}>
                <Input
                  value={tags}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setTags([]);
                      return;
                    }
                    setTags(e.target.value.split(","))
                  }}
                  style={{}}
                  className="primary-text"
                />
              </div>
              <div style={{ fontSize: 12, }}>
                <Text className="secondary-text flex flex-wrap" style={{ textAlign: 'start', alignItems: 'center', marginTop: 4 }}>*Separate with a comma (case sensitive).
                  {tags.length === 0 && suggestedTags.length > 0 && <div style={{ marginLeft: 4, marginRight: 4 }}>Suggested:</div>}
                  {
                    (tags.length === 0 ? suggestedTags : tags).map((tag: any, idx: number) => {
                      if (!tag) return
                      return (
                        <Tag key={tag + idx} className="card-bg secondary-text" style={{ margin: 2 }}>
                          {tag}
                        </Tag>
                      )
                    })
                  }
                </Text>
              </div>

              <div style={{ display: "flex", marginTop: 4 }} className='secondary-text'>

              </div>
            </Form.Item>

            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Categories
                </Text>
              }
            >
              <div className="flex-between" style={{}}>
                <Input
                  value={categories}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setCategories([]);
                      return;
                    }
                    setCategories(e.target.value.split(","))
                  }}
                  style={{}}
                  className="primary-text"
                />
              </div>
              <div style={{ fontSize: 12 }}>
                <Text className="secondary-text flex flex-wrap" style={{ textAlign: 'start', alignItems: 'center', marginTop: 4 }}>
                  *Separate with a comma (case sensitive).
                  {categories.length === 0 && suggestedCategories.length > 0 && <div style={{ marginLeft: 4, marginRight: 4 }}>Suggested:</div>}
                  {
                    (categories.length === 0 ? suggestedCategories : categories).map((tag: any, idx: number) => {
                      if (!tag) return
                      return (
                        <Tag key={tag + idx} className="card-bg secondary-text" style={{ margin: 2 }}>
                          {tag}
                        </Tag>
                      )
                    })
                  }
                </Text>
              </div>

            </Form.Item>
          </Form>
          <div className=''>
            <BadgeRadioFilter title='Currently Circulating?' value={hasCirculatingSupplyFilter} setValue={setHasCirculatingSupplyFilter} options={[
              { label: 'No', value: false }, { label: 'Yes', value: true },
            ]} />
            <BadgeRadioFilter title='Frozen Metadata?' value={canUpdateMetadataFilter} setValue={setCanUpdateMetadataFilter} options={[
              { label: 'No', value: false }, { label: 'Yes', value: true },
            ]} />
            <BadgeRadioFilter title='Locked Supply?' value={canCreateMoreFilter} setValue={setCanCreateMoreFilter} options={[
              { label: 'No', value: false }, { label: 'Yes', value: true },
            ]} />
            <BadgeRadioFilter title='Frozen Transferability?' value={canUpdateTransferabilityFilter} setValue={setCanUpdateTransferabilityFilter} options={[
              { label: 'No', value: false }, { label: 'Yes', value: true },
            ]} />
          </div>
          <br />
          <hr />

        </>
      }

      <br />
      {
        loading && <>
          <div className='flex-center flex-wrap'>
            <Spin size='large' />
          </div>
          <Divider />
        </>
      }
      <div className="flex-center flex-wrap full-width">
        <BadgeInfiniteScroll
          cardView={cardView}
          badgesToShow={customView ? [{
            collectionId,
            badgeIds: customView
          }] : collection ? [{
            collectionId,
            badgeIds: filteredBadges
          }] : []}
          hasMore={customView ? customViewPagination?.hasMore ?? true : false}
          fetchMore={async () => {
            if (!customView) return;
            await fetchMore();
          }}
          groupByCollection={false}
          editMode={false}
          addressOrUsername=''
          sortBy={sortByMostViewed ? undefined : sortBy}
        />
      </div>
    </div >
  );
}
