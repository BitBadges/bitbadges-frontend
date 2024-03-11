import { CloseCircleOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Layout, Tag, Typography, notification } from 'antd';
import {
  AccountViewKey,
  BatchBadgeDetails,
  BatchBadgeDetailsArray,
  BitBadgesAddressList,
  BitBadgesCollection,
  UintRangeArray
} from 'bitbadgesjs-sdk';
import { SHA256 } from 'crypto-js';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAddressLists } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, fetchNextForAccountViews, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import {
  addBadgeToPage,
  addListToPage,
  addNewCustomPage,
  deleteCustomPage,
  moveTab,
  removeBadgeFromPage,
  removeListFromPage
} from '../../bitbadges-api/utils/customPageUtils';
import { AccountHeader } from '../../components/badges/AccountHeader';
import { BadgeAvatar } from '../../components/badges/BadgeAvatar';
import { BadgeInfiniteScroll } from '../../components/badges/BadgeInfiniteScroll';
import { BatchBadgeDetailsTag, OptionsSelects } from '../../components/badges/DisplayFilters';
import { ListInfiniteScroll } from '../../components/badges/ListInfiniteScroll';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { ListActivityTab } from '../../components/collection-page/ListActivityDisplay';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { DevMode } from '../../components/common/DevMode';
import { CustomizeAddRemoveBadgeFromPage, CustomizeAddRemoveListFromPage, NewPageInputForm } from '../../components/display/CustomPages';
import { ExperiencesProtocolDisplay } from '../../components/display/ExperiencesProtocol';
import { FollowProtocolDisplay } from '../../components/display/FollowProtocol';
import IconButton from '../../components/display/IconButton';
import { Tabs } from '../../components/navigation/Tabs';
import { ReportedWrapper } from '../../components/wrappers/ReportedWrapper';
import { INFINITE_LOOP_MODE } from '../../constants';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { GlobalReduxState } from '../_app';

const { Content } = Layout;

//Applies any filters client side and returns the filtered badgeIds
export function applyClientSideBadgeFilters(
  allBadgeIds: BatchBadgeDetailsArray<bigint>,
  onlySpecificCollections: BatchBadgeDetailsArray<bigint> = new BatchBadgeDetailsArray<bigint>(),
  oldestFirst: boolean = false,
  collections: Record<string, Readonly<BitBadgesCollection<bigint> | undefined>> = {}
): BatchBadgeDetailsArray<bigint> {
  //Filter to only include the specific collections requested (if any)
  if (onlySpecificCollections.length > 0) {
    const filtered = new BatchBadgeDetailsArray<bigint>();
    for (const badgeIdObj of allBadgeIds) {
      for (const filteredCollection of onlySpecificCollections) {
        const collectionId = filteredCollection.collectionId;
        if (badgeIdObj.collectionId === collectionId) {
          badgeIdObj.badgeIds = badgeIdObj.badgeIds.getOverlaps(filteredCollection.badgeIds);
          filtered.push(badgeIdObj);
        }
      }
    }
    allBadgeIds = filtered;
  }

  //Filter out the max badge ID for each collection
  for (const badgeIdObj of allBadgeIds) {
    const collection = collections[`${badgeIdObj.collectionId}`];
    if (!collection) continue;
    const maxBadgeId = collection.getMaxBadgeId();
    badgeIdObj.badgeIds.remove([{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }]);
  }

  //Apply client-side sorts
  if (oldestFirst) {
    allBadgeIds = allBadgeIds.sort((a, b) => (a.collectionId > b.collectionId ? 1 : -1));
  } else {
    allBadgeIds = allBadgeIds.sort((a, b) => (a.collectionId < b.collectionId ? 1 : -1));
  }

  return allBadgeIds.filter((x) => x.badgeIds.length > 0);
}

// Applies any filters client side and returns the filtered lists
export const applyClientSideListFilters = (
  lists: BitBadgesAddressList<bigint>[],
  onlySpecificLists: string[] = [],
  oldestFirst: boolean = false
): BitBadgesAddressList<bigint>[] => {
  if (onlySpecificLists.length > 0) {
    lists = lists.filter((x) => onlySpecificLists.includes(x.listId));
  }

  if (oldestFirst) {
    lists.sort((a, b) => (a.createdBlock > b.createdBlock ? 1 : -1));
  } else {
    lists.sort((a, b) => (a.createdBlock < b.createdBlock ? 1 : -1));
  }

  return lists;
};

const getUniqueViewId = (baseViewId: string, specificCollections: string[], oldestFirst: boolean) => {
  let newViewId = baseViewId;
  if (specificCollections.length > 0) {
    newViewId += ':' + SHA256(JSON.stringify(specificCollections)).toString();
  }

  if (oldestFirst) {
    newViewId += ':oldestFirst';
  }

  return newViewId;
};

function PortfolioPage() {
  const router = useRouter();

  const chain = useChainContext();
  const collections = useSelector((state: GlobalReduxState) => state.collections.collections);
  const { addressOrUsername } = router.query;
  const accountInfo = useAccount(addressOrUsername as string);
  const [tab, setTab] = useState('collected');
  const [addPageIsVisible, setAddPageIsVisible] = useState(false);
  const [warned, setWarned] = useState(false);
  const [badgeTab, setBadgeTab] = useState('All');
  const [cardView, setCardView] = useState(true);
  const [onlySpecificCollections, setOnlySpecificCollections] = useState<BatchBadgeDetailsArray<bigint>>(new BatchBadgeDetailsArray<bigint>());
  const [onlySpecificLists, setOnlyFilteredLists] = useState<string[]>([]);
  const [groupByCollection, setGroupByCollection] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [listsTab, setListsTab] = useState<string>('allLists');
  const [oldestFirst, setOldestFirst] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [activityTab, setActivityTab] = useState('badges');
  const [customView, setCustomView] = useState<Array<BitBadgesAddressList<bigint>>>([]);

  //Base = a view supported by the backend with pagination
  const baseBadgeViews = ['All', 'Managing', 'Created'];
  const baseListViews = ['allLists', 'whitelists', 'blacklists', 'privateLists', 'createdLists'];

  const badgeViewId = useMemo(() => {
    const baseViewId = badgeTab === 'Managing' ? 'managingBadges' : badgeTab === 'Created' ? 'createdBadges' : 'badgesCollected';
    if (accountInfo?.views[baseViewId]?.pagination?.hasMore === false) {
      // We can handle all filters client-side using the base view
      return baseViewId;
    }

    return getUniqueViewId(
      baseViewId,
      onlySpecificCollections.map((x) => x.toJsonString()),
      oldestFirst
    );
  }, [badgeTab, oldestFirst, accountInfo, onlySpecificCollections]);

  const listViewId = useMemo(() => {
    const baseViewId = listsTab;
    if (accountInfo?.views[baseViewId]?.pagination?.hasMore === false) {
      // We can handle all filters client-side using the base view
      return baseViewId;
    }

    return getUniqueViewId(baseViewId, onlySpecificLists, oldestFirst);
  }, [listsTab, oldestFirst, accountInfo, onlySpecificLists]);

  const isBaseBadgeTab = baseBadgeViews.includes(badgeTab);
  const isBaseListTab = baseListViews.includes(listsTab);
  const isBaseListView = baseListViews.includes(listViewId);

  //If it is a custom view, we do not have any pagination (all are fetched at once)
  const badgesView = isBaseBadgeTab ? accountInfo?.views[badgeViewId] : undefined;
  const listsView = isBaseListTab ? accountInfo?.views[listViewId] : undefined;
  const badgesPagination = isBaseBadgeTab ? badgesView?.pagination : { hasMore: false, bookmark: '' };
  const listsPagination = isBaseListTab ? listsView?.pagination : { hasMore: false, bookmark: '' };

  const currCustomBadgePage = useMemo(() => {
    return accountInfo?.clone().customPages?.badges?.find((x) => x.title === badgeTab);
  }, [badgeTab, accountInfo]);

  const currCustomListPage = useMemo(() => {
    return accountInfo?.clone().customPages?.lists?.find((x) => x.title === listsTab);
  }, [listsTab, accountInfo]);

  const currBadgePageItems = useMemo(() => {
    return BatchBadgeDetailsArray.From(badgeTab === 'Hidden' ? accountInfo?.clone().hiddenBadges ?? [] : currCustomBadgePage?.items ?? []);
  }, [badgeTab, currCustomBadgePage, accountInfo]);

  const currListPageItems = useMemo(() => {
    return listsTab === 'Hidden' ? accountInfo?.clone().hiddenLists ?? [] : currCustomListPage?.items ?? [];
  }, [listsTab, currCustomListPage, accountInfo]);

  useEffect(() => {
    if (accountInfo?.cosmosAddress === chain.cosmosAddress && !chain.loggedIn && chain.cosmosAddress && !warned) {
      notification.info({
        message: 'You must sign in to customize your portfolio.'
      });
      setWarned(true);
    }
  }, [accountInfo, chain, warned]);

  useEffect(() => {
    if (listsTab !== '') {
      setAddPageIsVisible(false);
    }
  }, [listsTab]);

  useEffect(() => {
    if (badgeTab !== '') {
      setAddPageIsVisible(false);
    }
  }, [badgeTab]);

  const tabInfo = [];
  tabInfo.push(
    { key: 'collected', content: 'Badges', disabled: false },
    { key: 'lists', content: 'Lists' },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'reviews', content: 'Reviews' },
    { key: 'protocols', content: 'Protocols' }
  );

  const badgePageTabInfo = [{ key: 'collected', content: 'All', disabled: false }];
  if (accountInfo?.customPages?.badges) {
    for (const customPage of accountInfo?.customPages?.badges) {
      badgePageTabInfo.push({
        key: customPage.title,
        content: customPage.title,
        disabled: false
      });
    }
  }

  useEffect(() => {
    if (!accountInfo?.address) return;

    for (const id of onlySpecificCollections) {
      fetchBalanceForUser(id.collectionId, accountInfo?.address);
    }
  }, [onlySpecificCollections, accountInfo?.address]);

  const finalBadgeView = useMemo(() => {
    const allBadgeIds: BatchBadgeDetailsArray<bigint> = new BatchBadgeDetailsArray<bigint>();

    //Get correct view: "All", "Hidden", "Managing", "Created", or custom page
    //Put all badge IDs from view into allBadgeIds
    if (badgeTab === 'Hidden') {
      allBadgeIds.add(accountInfo?.hiddenBadges ?? []);
    } else if (isBaseBadgeTab) {
      if (badgeTab === 'All') {
        const collectedBadges = accountInfo?.getAccountBalancesView('badgesCollected') ?? [];
        for (const balanceInfo of collectedBadges) {
          if (!balanceInfo) {
            continue;
          }

          allBadgeIds.add({
            badgeIds: balanceInfo.balances.getAllBadgeIds(),
            collectionId: balanceInfo.collectionId
          });
        }
      } else {
        //.ids are a string[] of collectionIds
        //we will filter > max out later
        //For created and managing, we add all badges from the collections
        const badgesToAdd =
          (badgesView?.ids
            .map((id) => {
              return {
                collectionId: BigInt(id),
                badgeIds: UintRangeArray.FullRanges()
              };
            })
            .filter((x) => x) as BatchBadgeDetailsArray<bigint>) ?? [];

        allBadgeIds.push(...badgesToAdd);
      }
    } else {
      const currCustomBadgePage = accountInfo?.clone().customPages?.badges?.find((x) => x.title === badgeTab);
      allBadgeIds.push(...(currCustomBadgePage?.items ?? []));
    }

    return applyClientSideBadgeFilters(allBadgeIds, onlySpecificCollections, oldestFirst, collections);
  }, [accountInfo, badgeTab, onlySpecificCollections, badgesView?.ids, collections, oldestFirst, isBaseBadgeTab]);

  useEffect(() => {
    if (isBaseBadgeTab) return;

    //Edge case to fetch non-indexed balances
    for (const badgeIdObj of finalBadgeView) {
      const collection = collections[`${badgeIdObj.collectionId}`];
      if (collection && collection.balancesType === 'Off-Chain - Non-Indexed' && accountInfo?.address) {
        console.log("fetching non-indexed balances");
        fetchBalanceForUser(badgeIdObj.collectionId, accountInfo?.address);
      }
    }
  }, [finalBadgeView, collections, accountInfo?.address, isBaseBadgeTab]);

  useMemo(async () => {
    //Little hacky but if baseListView is not altered above, it has no more pagination, and thus we can handle all filters client-side
    if (isBaseListTab) {
      //If it is a normal view (not a custom page / Hidden), we handle all filters here
      //If we have no pagination left, all are handled client side. Else, we create a new unique view above and handle on backend query
      const view = applyClientSideListFilters(accountInfo?.getAccountAddressListsView(listViewId) ?? [], onlySpecificLists, oldestFirst);
      setCustomView(view);
      return;
    }

    //If not a base list view, it is a custom view which we have complete list for already

    //Remove any cached lists from idsToFetch
    const allIds = [...currListPageItems];
    const cachedLists = customView.map((x) => x.clone());
    const idsToFetch = [...currListPageItems].filter((x) => !cachedLists.find((y) => y.listId === x));
    const listsToFetch = idsToFetch.map((x) => {
      return { listId: x };
    });

    if (listsToFetch.length > 0) {
      const res = await getAddressLists({ listsToFetch });
      cachedLists.push(...res.addressLists);
    }

    const newView = [];
    for (const id of allIds) {
      const list = cachedLists.find((x) => x.listId === id);
      if (!list) continue;

      newView.push(list);
    }

    setCustomView(applyClientSideListFilters(newView, onlySpecificLists, oldestFirst));
  }, [listsTab, accountInfo, isBaseListTab, listViewId, onlySpecificLists, oldestFirst, currListPageItems]);

  const fetchNextPageForView = useCallback(async () => {
    if (tab === 'lists' && isBaseListView && listsTab === 'privateLists' && !chain.loggedIn) return;

    const viewId = tab === 'collected' ? badgeViewId : listViewId;
    const viewType = viewId.split(':')[0] as AccountViewKey;
    await fetchNextForAccountViews(
      addressOrUsername as string,
      viewType,
      viewId,
      tab === 'collected' ? onlySpecificCollections : undefined,
      tab === 'lists' ? onlySpecificLists : undefined,
      oldestFirst
    );
  }, [
    addressOrUsername,
    listViewId,
    badgeViewId,
    onlySpecificCollections,
    onlySpecificLists,
    oldestFirst,
    tab,
    isBaseListView,
    listsTab,
    chain.loggedIn
  ]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch more collected');
    if (!accountInfo?.address) return;
    if (tab === 'activity' || tab == 'reviews') return;

    fetchNextPageForView();
  }, [fetchNextPageForView, accountInfo, chain.loggedIn, chain.address, tab, listsTab, isBaseListView]);

  //Default fetch account, if not fetched already
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      if (!addressOrUsername) return;
      await fetchAccounts([addressOrUsername as string]);
    }
    getPortfolioInfo();
  }, [addressOrUsername]);

  if (!accountInfo) {
    return <></>;
  }

  const NewPageForm = (
    <>
      <NewPageInputForm
        visible={addPageIsVisible}
        setVisible={setAddPageIsVisible}
        onAddPage={async (newPageTitle: string, newPageDescription: string) => {
          await addNewCustomPage(accountInfo, newPageTitle, newPageDescription, tab === 'lists' ? 'lists' : 'badges', 'customPages');
          if (tab === 'lists') {
            setListsTab(newPageTitle);
          } else {
            setBadgeTab(newPageTitle);
          }
        }}
      />
      {addPageIsVisible && <br />}
    </>
  );

  return (
    <ReportedWrapper
      reported={!!accountInfo?.reported ?? false}
      node={
        <>
          <Content
            style={{
              textAlign: 'center',
              minHeight: '100vh'
            }}>
            <div
              style={{
                marginLeft: '3vw',
                marginRight: '3vw',
                paddingLeft: '1vw',
                paddingRight: '1vw',
                paddingTop: '20px'
              }}>
              {accountInfo && <AccountHeader addressOrUsername={accountInfo.address} />}

              <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} fullWidth />

              {tab === 'collected' && (
                <>
                  <OptionsSelects
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    onlySpecificCollections={onlySpecificCollections}
                    setOnlySpecificCollections={setOnlySpecificCollections}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    onlySpecificLists={onlySpecificLists}
                    setOnlyFilteredLists={setOnlyFilteredLists}
                    cardView={cardView}
                    setCardView={setCardView}
                    groupByCollection={groupByCollection}
                    setGroupByCollection={setGroupByCollection}
                    addressOrUsername={addressOrUsername as string}
                    setOldestFirst={setOldestFirst}
                    oldestFirst={oldestFirst}
                  />
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
                  {onlySpecificCollections.length > 0 && <br />}
                </>
              )}

              {/* Tab Content */}
              {tab === 'collected' && (
                <>
                  <div className="">
                    <div className="flex-center flex-wrap">
                      <Tabs
                        onDeleteCurrTab={
                          !editMode || badgeTab == '' || isBaseBadgeTab || badgeTab == 'Hidden'
                            ? undefined
                            : async (badgeTab: string) => {
                                await deleteCustomPage(accountInfo, badgeTab, 'badges', 'customPages');
                              }
                        }
                        onLeftRight={async (direction: 'left' | 'right') => {
                          await moveTab(accountInfo, direction, badgeTab, 'badges', 'customPages');
                        }}
                        showLeft={accountInfo.customPages?.badges && accountInfo.customPages?.badges?.findIndex((x) => x.title === badgeTab) !== 0}
                        showRight={
                          accountInfo.customPages?.badges &&
                          accountInfo.customPages?.badges?.findIndex((x) => x.title === badgeTab) !==
                            (accountInfo.customPages?.badges ?? [])?.length - 1
                        }
                        tabInfo={[
                          {
                            key: 'All',
                            content: 'All',
                            disabled: false
                          },

                          {
                            key: 'Created',
                            content: 'Created',
                            disabled: false
                          },
                          {
                            key: 'Managing',
                            content: 'Managing',
                            disabled: false
                          },

                          ...(editMode
                            ? [
                                {
                                  key: 'Hidden',
                                  content: 'Hidden',
                                  disabled: false
                                }
                              ]
                            : []),
                          ...(accountInfo.customPages?.badges.map((x) => {
                            return {
                              key: x.title,
                              content: x.title,
                              disabled: false
                            };
                          }) ?? [])
                        ]}
                        tab={badgeTab}
                        setTab={setBadgeTab}
                        type={'underline'}
                      />

                      {editMode && (
                        <IconButton
                          src={!addPageIsVisible ? <PlusOutlined /> : <MinusOutlined />}
                          text=""
                          tooltipMessage="Add a new page to your portfolio."
                          onClick={() => {
                            setAddPageIsVisible(!addPageIsVisible);
                            setBadgeTab(''); //Reset tab
                          }}
                        />
                      )}
                    </div>

                    {badgeTab === 'Hidden' && (
                      <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                        <InfoCircleOutlined /> Hidden badges will be automatically filtered out from standard views and not shown by default.
                      </div>
                    )}
                    {badgeTab !== '' && currCustomBadgePage?.description && (
                      <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                        {currCustomBadgePage?.description}
                      </div>
                    )}

                    {badgeTab != 'All' && badgeTab != '' && badgeTab != 'Created' && badgeTab != 'Managing' && editMode && (
                      <div className="flex-center">
                        <CustomizeAddRemoveBadgeFromPage
                          currItems={currBadgePageItems}
                          onAdd={async (selectedBadge: BatchBadgeDetails<bigint>) => {
                            await addBadgeToPage(accountInfo, selectedBadge, badgeTab, 'customPages');
                          }}
                          onRemove={async (selectedBadge: BatchBadgeDetails<bigint>) => {
                            await removeBadgeFromPage(accountInfo, selectedBadge, badgeTab, 'customPages');
                          }}
                        />
                      </div>
                    )}
                    {NewPageForm}

                    {badgeTab !== '' && (
                      <>
                        <BadgeInfiniteScroll
                          addressOrUsername={addressOrUsername as string}
                          badgesToShow={finalBadgeView}
                          cardView={cardView}
                          editMode={editMode}
                          hasMore={badgesPagination?.hasMore ?? true}
                          fetchMore={async () => {
                            const hasMore = badgesPagination?.hasMore ?? true;
                            if (hasMore) {
                              await fetchNextPageForView();
                            }
                          }}
                          groupByCollection={groupByCollection}
                          customPageName={badgeTab}
                        />
                      </>
                    )}
                  </div>
                </>
              )}

              {tab === 'lists' && (
                <>
                  <OptionsSelects
                    isListsSelect
                    onlySpecificLists={onlySpecificLists}
                    setOnlyFilteredLists={setOnlyFilteredLists}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    onlySpecificCollections={onlySpecificCollections}
                    setOnlySpecificCollections={setOnlySpecificCollections}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    cardView={cardView}
                    setCardView={setCardView}
                    groupByCollection={groupByCollection}
                    setGroupByCollection={setGroupByCollection}
                    addressOrUsername={addressOrUsername as string}
                    setOldestFirst={setOldestFirst}
                    oldestFirst={oldestFirst}
                  />
                  <br />

                  <div className="full-width flex-center flex-wrap">
                    {onlySpecificLists.map((listId, idx) => {
                      return (
                        <ListFilterTag
                          key={idx}
                          addressOrUsername={accountInfo.address}
                          listId={listId}
                          onClose={() => setOnlyFilteredLists(onlySpecificLists.filter((x) => x !== listId))}
                        />
                      );
                    })}
                  </div>

                  <div className="flex-center">
                    <Tabs
                      onDeleteCurrTab={
                        !editMode || listsTab == '' || isBaseListView
                          ? undefined
                          : async (listsTab: string) => {
                              await deleteCustomPage(accountInfo, listsTab, 'lists', 'customPages');
                            }
                      }
                      onLeftRight={async (direction: 'left' | 'right') => {
                        await moveTab(accountInfo, direction, listsTab, 'lists', 'customPages');
                      }}
                      showLeft={accountInfo.customPages?.lists && accountInfo.customPages?.lists?.findIndex((x) => x.title === listsTab) !== 0}
                      showRight={
                        accountInfo.customPages?.lists &&
                        accountInfo.customPages?.lists?.findIndex((x) => x.title === listsTab) !== (accountInfo.customPages?.lists ?? [])?.length - 1
                      }
                      tabInfo={[
                        {
                          key: 'allLists',
                          content: 'All',
                          disabled: false
                        },
                        {
                          key: 'whitelists',
                          content: 'Included',
                          disabled: false
                        },
                        {
                          key: 'blacklists',
                          content: 'Excluded',
                          disabled: false
                        },
                        {
                          key: 'createdLists',
                          content: 'Created',
                          disabled: false
                        },
                        chain.cosmosAddress && chain.cosmosAddress === accountInfo.cosmosAddress
                          ? {
                              key: 'privateLists',
                              content: 'Private',
                              disabled: false
                            }
                          : undefined,
                        ...(editMode
                          ? [
                              {
                                key: 'Hidden',
                                content: 'Hidden',
                                disabled: false
                              }
                            ]
                          : []),
                        ...(accountInfo.customPages?.lists?.map((customPage) => {
                          return {
                            key: customPage.title,
                            content: customPage.title,
                            disabled: false
                          };
                        }) ?? [])
                      ]}
                      tab={listsTab}
                      setTab={(e) => {
                        setListsTab(e as AccountViewKey);
                      }}
                      type="underline"
                    />

                    {editMode && (
                      <IconButton
                        src={!addPageIsVisible ? <PlusOutlined /> : <MinusOutlined />}
                        text=""
                        tooltipMessage="Add a new page to your portfolio."
                        onClick={() => {
                          setAddPageIsVisible(!addPageIsVisible);
                          setListsTab(''); //Reset tab
                        }}
                      />
                    )}
                  </div>
                  {listsTab === 'Hidden' && (
                    <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                      <InfoCircleOutlined /> Hidden lists will be automatically filtered out from standard views and not shown by default.
                    </div>
                  )}
                  {listsTab === 'All' && (
                    <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                      <InfoCircleOutlined /> These results include whitelists and blacklists.
                    </div>
                  )}
                  {listsTab === 'whitelists' && (
                    <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                      <InfoCircleOutlined /> These results only include whitelists.
                    </div>
                  )}
                  {listsTab === 'blacklists' && (
                    <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                      <InfoCircleOutlined /> These results only include blacklists.
                    </div>
                  )}
                  {listsTab === 'createdLists' && (
                    <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                      <InfoCircleOutlined /> These results include lists created by this user.
                    </div>
                  )}
                  {listsTab === 'privateLists' && (
                    <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                      <InfoCircleOutlined /> These results include private lists created by you and are only visible to you.
                    </div>
                  )}
                  {listsTab !== '' && !isBaseListView && currCustomListPage?.description && (
                    <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                      {currCustomListPage?.description}
                    </div>
                  )}

                  {!isBaseListView && listsTab != '' && editMode && (
                    <div className="flex-center">
                      <CustomizeAddRemoveListFromPage
                        currItems={currListPageItems}
                        addressOrUsername={accountInfo.address}
                        onAdd={async (selectedList: string) => {
                          await addListToPage(accountInfo, selectedList, listsTab, 'customPages');
                        }}
                        onRemove={async (selectedList: string) => {
                          await removeListFromPage(accountInfo, selectedList, listsTab, 'customPages');
                        }}
                      />
                    </div>
                  )}

                  {NewPageForm}
                  {listsTab !== '' && (
                    <>
                      {listsTab === 'privateLists' && !chain.loggedIn ? (
                        <BlockinDisplay />
                      ) : (
                        <ListInfiniteScroll
                          fetchMore={async () => {
                            await fetchNextPageForView();
                          }}
                          hasMore={listsPagination?.hasMore ?? true}
                          listsView={customView}
                          addressOrUsername={accountInfo?.address ?? ''}
                          showInclusionDisplay={!(listsTab === 'privateLists' || listsTab === 'createdLists')}
                          showCustomizeButtons={editMode}
                          isWatchlist={false}
                          currPageName={listsTab}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {tab === 'reviews' && (
                <ReputationTab
                  reviews={accountInfo?.reviews ?? []}
                  fetchMore={async () => {
                    await fetchNextForAccountViews(accountInfo?.address ?? '', 'reviews', 'reviews');
                  }}
                  hasMore={accountInfo?.views['reviews']?.pagination?.hasMore ?? true}
                  addressOrUsername={accountInfo?.address ?? ''}
                />
              )}

              {tab === 'protocols' && (
                <>
                  <br />
                  <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
                    <FollowProtocolDisplay addressOrUsername={accountInfo.address} />
                    <ExperiencesProtocolDisplay addressOrUsername={accountInfo.address} />
                  </div>
                </>
              )}

              {tab === 'activity' && (
                <>
                  <br />
                  <div className="flex-center">
                    <Tabs
                      type="underline"
                      tab={activityTab}
                      setTab={setActivityTab}
                      tabInfo={[
                        {
                          key: 'badges',
                          content: 'Badges',
                          disabled: false
                        },
                        {
                          key: 'lists',
                          content: 'Lists',
                          disabled: false
                        }
                      ]}
                    />
                  </div>
                  <br />
                  {activityTab === 'badges' && (
                    <ActivityTab
                      activity={accountInfo.getAccountActivityView('transferActivity') ?? []}
                      fetchMore={async () => {
                        await fetchNextForAccountViews(accountInfo?.address ?? '', 'transferActivity', 'transferActivity');
                      }}
                      hasMore={accountInfo?.views['transferActivity']?.pagination?.hasMore ?? true}
                    />
                  )}
                  {activityTab === 'lists' && (
                    <ListActivityTab
                      activity={accountInfo.getAccountListsActivityView('listsActivity') ?? []}
                      fetchMore={async () => {
                        await fetchNextForAccountViews(accountInfo?.address ?? '', 'listsActivity', 'listsActivity');
                      }}
                      hasMore={accountInfo?.views['listsActivity']?.pagination?.hasMore ?? true}
                    />
                  )}
                </>
              )}
            </div>
            <DevMode obj={accountInfo} />
            <Divider />
          </Content>
        </>
      }
    />
  );
}

export const ListFilterTag = ({ listId, addressOrUsername, onClose }: { listId: string; addressOrUsername: string; onClose: () => void }) => {
  const accountInfo = useAccount(addressOrUsername);
  const metadata = accountInfo?.addressLists?.find((x) => x.listId === listId)?.metadata;

  return (
    <Tag
      className="primary-text inherit-bg flex-between"
      style={{ alignItems: 'center', marginBottom: 8 }}
      closable
      closeIcon={
        <CloseCircleOutlined
          className="primary-text styled-button-normal flex-center"
          style={{
            border: 'none',
            fontSize: 16,
            alignContent: 'center',
            marginLeft: 5
          }}
          size={100}
        />
      }
      onClose={() => {
        onClose();
      }}>
      <div
        className="primary-text inherit-bg"
        style={{
          alignItems: 'center',
          marginRight: 4,
          maxWidth: 280
        }}>
        <div className="flex-center" style={{ alignItems: 'center', maxWidth: 280 }}>
          <div>
            <BadgeAvatar
              size={30}
              noHover
              collectionId={0n}
              metadataOverride={accountInfo?.addressLists?.find((x) => x.listId === listId)?.metadata}
            />
          </div>
          <Typography.Text
            className="primary-text"
            style={{
              alignItems: 'center',
              fontSize: 16,
              fontWeight: 'bold',
              margin: 4,
              overflowWrap: 'break-word'
            }}>
            <div>{metadata?.name}</div>
          </Typography.Text>
        </div>
      </div>
      <br />
    </Tag>
  );
};

export default PortfolioPage;
