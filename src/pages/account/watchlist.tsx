import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Layout, notification } from 'antd';
import { AccountViewKey, BatchBadgeDetailsArray, BitBadgesAddressList } from 'bitbadgesjs-sdk';
import { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { BatchBadgeDetails } from 'bitbadgesjs-sdk';
import { useSelector } from 'react-redux';
import { getAddressLists } from '../../bitbadges-api/api';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
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
import { BadgeInfiniteScroll } from '../../components/badges/BadgeInfiniteScroll';
import { BatchBadgeDetailsTag, OptionsSelects } from '../../components/badges/DisplayFilters';
import { ListInfiniteScroll } from '../../components/badges/ListInfiniteScroll';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { DevMode } from '../../components/common/DevMode';
import { CustomizeAddRemoveBadgeFromPage, CustomizeAddRemoveListFromPage, NewPageInputForm } from '../../components/display/CustomPages';
import IconButton from '../../components/display/IconButton';
import { Tabs } from '../../components/navigation/Tabs';
import { compareObjects } from '../../utils/compare';
import { GlobalReduxState } from '../_app';
import { ListFilterTag, applyClientSideBadgeFilters, applyClientSideListFilters } from './[addressOrUsername]';

const { Content } = Layout;

function WatchlistPage() {
  const chain = useChainContext();
  const accountInfo = useAccount(chain.address);

  const [tab, setTab] = useState(accountInfo?.readme ? 'overview' : 'collected');
  const [addPageIsVisible, setAddPageIsVisible] = useState(false);
  const [warned, setWarned] = useState(false);
  const [oldestFirst, setOldestFirst] = useState(false);

  useEffect(() => {
    if (accountInfo?.cosmosAddress === chain.cosmosAddress && !chain.loggedIn && chain.cosmosAddress && !warned) {
      notification.info({
        message: 'You must sign in to customize your watchlist.'
      });
      setWarned(true);
    }
  }, [accountInfo, chain, warned]);

  const [badgeTab, setBadgeTab] = useState(
    accountInfo?.watchlists?.badges && accountInfo?.watchlists?.badges?.length > 0 ? accountInfo?.watchlists?.badges[0].title : ''
  );

  const [listsTab, setListsTab] = useState<string>(
    accountInfo?.watchlists?.lists && accountInfo?.watchlists?.lists?.length > 0 ? accountInfo?.watchlists?.lists[0].title : ''
  );

  useEffect(() => {
    if (badgeTab !== '') {
      setAddPageIsVisible(false);
    }
  }, [badgeTab]);

  useEffect(() => {
    if (listsTab !== '') {
      setAddPageIsVisible(false);
    }
  }, [listsTab]);

  const [cardView, setCardView] = useState(true);
  const [onlySpecificCollections, setOnlySpecificCollections] = useState<BatchBadgeDetailsArray<bigint>>(new BatchBadgeDetailsArray<bigint>());
  const [groupByCollection, setGroupByCollection] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [searchValue, setSearchValue] = useState<string>('');
  const [tabSetInitial, setTabSetInitial] = useState(!!accountInfo);

  const collections = useSelector((state: GlobalReduxState) => state.collections.collections);

  useEffect(() => {
    if (!accountInfo) return;
    if (tabSetInitial) return;
    setTabSetInitial(true);
    if (!listsTab)
      setListsTab(accountInfo?.watchlists?.lists && accountInfo?.watchlists?.lists?.length > 0 ? accountInfo?.watchlists?.lists[0].title : '');
    if (!badgeTab)
      setBadgeTab(accountInfo?.watchlists?.badges && accountInfo?.watchlists?.badges?.length > 0 ? accountInfo?.watchlists?.badges[0].title : '');
  }, [accountInfo, badgeTab, listsTab, tabSetInitial]);

  const tabInfo = [];
  tabInfo.push({ key: 'collected', content: 'Badges', disabled: false }, { key: 'lists', content: 'Lists' });

  const badgePageTabInfo = [];

  if (accountInfo?.watchlists?.badges) {
    for (const customPage of accountInfo?.watchlists?.badges) {
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

  const listsForCurrPage = useMemo(() => {
    return accountInfo?.watchlists?.lists?.find((x) => x.title === listsTab)?.items ?? [];
  }, [accountInfo?.watchlists?.lists, listsTab]);

  const badgesForCurrPage = useMemo(() => {
    return accountInfo?.watchlists?.badges?.find((x) => x.title === badgeTab)?.items ?? [];
  }, [accountInfo?.watchlists?.badges, badgeTab]);

  const finalBadgesView = useMemo(() => {
    const allBadgeIds = new BatchBadgeDetailsArray<bigint>();
    allBadgeIds.push(...(badgesForCurrPage.map((x) => x.clone()) ?? []));

    return applyClientSideBadgeFilters(allBadgeIds, onlySpecificCollections, oldestFirst, collections);
  }, [onlySpecificCollections, collections, oldestFirst, badgesForCurrPage]);

  const [finalListsView, setFinalListsView] = useState<Array<BitBadgesAddressList<bigint>>>([]);
  const [onlySpecificLists, setOnlyFilteredLists] = useState<string[]>([]);

  useEffect(() => {
    async function getCustomView() {
      const idsToFetch = listsForCurrPage;
      const res = await getAddressLists({
        listsToFetch: idsToFetch.map((x) => {
          return { listId: x };
        })
      });
      const addressLists = applyClientSideListFilters(res.addressLists, onlySpecificLists, oldestFirst);
      setFinalListsView(addressLists);
    }

    getCustomView();
  }, [listsTab, accountInfo?.watchlists?.lists, oldestFirst, onlySpecificLists, listsForCurrPage]);

  if (!accountInfo) {
    return <></>;
  }

  if (!chain.connected) {
    return (
      <Content
        style={{
          textAlign: 'center',
          minHeight: '100vh'
        }}>
        <div className="flex-center flex-column pt-10">
          <BlockinDisplay />
        </div>
      </Content>
    );
  }

  const currBadgePage = accountInfo?.watchlists?.badges?.find((x) => x.title === badgeTab);
  const currListPage = accountInfo?.watchlists?.lists?.find((x) => x.title === listsTab);
  const currBadgePageItems = currBadgePage?.items ?? BatchBadgeDetailsArray.From([]);
  const currListPageItems = currListPage?.items ?? [];

  const badgesWatchlists = accountInfo?.watchlists?.badges ?? [];
  const listsWatchlists = accountInfo?.watchlists?.lists ?? [];

  return (
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
          <div
            className="flex-center primary-text"
            style={{
              alignItems: 'center',
              marginBottom: 16,
              fontSize: 25,
              fontWeight: 'bolder'
            }}>
            Watchlists
          </div>

          <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} fullWidth />

          {(tab === 'collected' || tab == 'hidden') && (
            <>
              <br />
              <OptionsSelects
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
                addressOrUsername={chain.address}
                oldestFirst={oldestFirst}
                setOldestFirst={setOldestFirst}
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
            </>
          )}

          {/* Tab Content */}
          {tab === 'collected' && (
            <>
              <div className="">
                <div className="flex-center flex-wrap">
                  {
                    <Tabs
                      onDeleteCurrTab={
                        !editMode
                          ? undefined
                          : async (badgeTab: string) => {
                              await deleteCustomPage(accountInfo, badgeTab, 'badges', 'watchlists');
                            }
                      }
                      onLeftRight={async (direction: 'left' | 'right') => {
                        await moveTab(accountInfo, direction, badgeTab, 'badges', 'watchlists');
                      }}
                      showLeft={badgesWatchlists && badgesWatchlists.findIndex((x) => x.title === badgeTab) !== 0}
                      showRight={badgesWatchlists && badgesWatchlists.findIndex((x) => x.title === badgeTab) !== (badgesWatchlists ?? [])?.length - 1}
                      tabInfo={[
                        ...(badgesWatchlists?.map((customPage) => {
                          return {
                            key: customPage.title,
                            content: customPage.title,
                            disabled: false
                          };
                        }) ?? [])
                      ]}
                      tab={badgeTab}
                      setTab={setBadgeTab}
                      type={'underline'}
                    />
                  }
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

                {badgeTab !== '' && currBadgePage?.description && (
                  <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                    {currBadgePage?.description}
                  </div>
                )}

                {!badgesWatchlists?.length && !addPageIsVisible && (
                  <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                    You have no custom pages. Sign in, go into customize mode, and click the plus button to add one.
                  </div>
                )}

                <br />

                {badgeTab != '' && editMode && (
                  <>
                    <div className="flex-center">
                      <CustomizeAddRemoveBadgeFromPage
                        currItems={currBadgePageItems}
                        onAdd={async (selectedBadge: BatchBadgeDetails<bigint>) => {
                          await addBadgeToPage(accountInfo, selectedBadge, badgeTab, 'watchlists');
                        }}
                        onRemove={async (selectedBadge: BatchBadgeDetails<bigint>) => {
                          await removeBadgeFromPage(accountInfo, selectedBadge, badgeTab, 'watchlists');
                        }}
                      />
                    </div>
                  </>
                )}

                <NewPageInputForm
                  visible={addPageIsVisible}
                  setVisible={setAddPageIsVisible}
                  onAddPage={async (newPageTitle: string, newPageDescription: string) => {
                    await addNewCustomPage(accountInfo, newPageTitle, newPageDescription, 'badges', 'watchlists');

                    setBadgeTab(newPageTitle);
                  }}
                />

                {badgeTab !== '' && (
                  <>
                    <BadgeInfiniteScroll
                      fetchMore={async () => {}}
                      hasMore={false}
                      cardView={cardView}
                      groupByCollection={groupByCollection}
                      addressOrUsername={accountInfo?.address ?? ''}
                      editMode={editMode}
                      badgesToShow={finalBadgesView}
                      isWatchlist
                      customPageName={badgeTab}
                    />
                  </>
                )}
              </div>
            </>
          )}

          {tab === 'lists' && (
            <>
              <br />
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
                addressOrUsername={chain.address}
                oldestFirst={oldestFirst}
                setOldestFirst={setOldestFirst}
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
                    !editMode
                      ? undefined
                      : async (listsTab: string) => {
                          await deleteCustomPage(accountInfo, listsTab, 'lists', 'watchlists');
                        }
                  }
                  onLeftRight={async (direction: 'left' | 'right') => {
                    await moveTab(accountInfo, direction, listsTab, 'lists', 'watchlists');
                  }}
                  showLeft={listsWatchlists && listsWatchlists?.findIndex((x) => x.title === listsTab) !== 0}
                  showRight={listsWatchlists && listsWatchlists?.findIndex((x) => x.title === listsTab) !== (listsWatchlists ?? [])?.length - 1}
                  tabInfo={[
                    ...(listsWatchlists?.map((customPage) => {
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
              {listsTab !== '' && (
                <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                  {currListPage?.description}
                </div>
              )}

              {!listsWatchlists?.length && !addPageIsVisible && (
                <div className="secondary-text" style={{ marginBottom: 16, marginTop: 4 }}>
                  You have no custom pages. Sign in, go into customize mode, and click the plus button to add one.
                </div>
              )}

              {listsTab != '' && editMode && (
                <>
                  <div className="flex-center">
                    <CustomizeAddRemoveListFromPage
                      currItems={currListPageItems}
                      addressOrUsername={accountInfo.address}
                      onAdd={async (selectedList: string) => {
                        await addListToPage(accountInfo, selectedList, listsTab, 'watchlists');
                      }}
                      onRemove={async (selectedList: string) => {
                        await removeListFromPage(accountInfo, selectedList, listsTab, 'watchlists');
                      }}
                    />
                  </div>
                </>
              )}

              <NewPageInputForm
                visible={addPageIsVisible}
                setVisible={setAddPageIsVisible}
                onAddPage={async (newPageTitle: string, newPageDescription: string) => {
                  await addNewCustomPage(accountInfo, newPageTitle, newPageDescription, 'lists', 'watchlists');

                  setListsTab(newPageTitle);
                }}
              />

              {listsTab !== '' && (
                <ListInfiniteScroll
                  fetchMore={async () => {}}
                  hasMore={false}
                  listsView={finalListsView}
                  addressOrUsername={accountInfo?.address ?? ''}
                  showInclusionDisplay={false}
                  showCustomizeButtons={editMode}
                  isWatchlist={true}
                  currPageName={listsTab}
                />
              )}
            </>
          )}
        </div>
        <DevMode obj={accountInfo} />
        <Divider />
      </Content>
    </>
  );
}

export default WatchlistPage;
