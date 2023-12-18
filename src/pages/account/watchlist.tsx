import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Layout, notification } from 'antd';
import { UintRange, deepCopy } from 'bitbadgesjs-proto';
import { AccountViewKey, AddressMappingWithMetadata, removeUintRangeFromUintRange } from 'bitbadgesjs-utils';
import { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { getAddressMappings } from '../../bitbadges-api/api';
import { updateProfileInfo, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, getCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { DevMode } from '../../components/common/DevMode';
import IconButton from '../../components/display/IconButton';
import { Tabs } from '../../components/navigation/Tabs';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { BatchBadgeDetails, BatchBadgeDetailsTag, BadgeInfiniteScroll, CustomizeAddRemoveBadgeFromPage, CustomizeAddRemoveListFromPage, ListInfiniteScroll, NewPageInputForm, OptionsSelects, addToArray, removeFromArray } from './[addressOrUsername]';

const { Content } = Layout;

function WatchlistPage() {

  const chain = useChainContext();

  const accountInfo = useAccount(chain.address);

  const [tab, setTab] = useState(accountInfo?.readme ? 'overview' : 'collected');
  const [addPageIsVisible, setAddPageIsVisible] = useState(false);
  const [warned, setWarned] = useState(false);

  useEffect(() => {
    if (accountInfo?.cosmosAddress === chain.cosmosAddress && !chain.loggedIn && chain.cosmosAddress && !warned) {
      notification.info({
        message: 'You must sign in to customize your watchlist.',
      });
      setWarned(true);
    }
  }, [accountInfo, chain, warned]);

  const [badgeTab, setBadgeTab] = useState(accountInfo?.watchedBadgePages && accountInfo?.watchedBadgePages?.length > 0 ? accountInfo?.watchedBadgePages[0].title : '');

  useEffect(() => {
    if (badgeTab !== '') {
      setAddPageIsVisible(false);
    }
  }, [badgeTab]);


  const [cardView, setCardView] = useState(true);
  const [filteredCollections, setFilteredCollections] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]);
  const [groupByCollection, setGroupByCollection] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [listsTab, setListsTab] = useState<string>(accountInfo?.watchedListPages && accountInfo?.watchedListPages?.length > 0 ? accountInfo?.watchedListPages[0].title : '');
  const [searchValue, setSearchValue] = useState<string>('');
  const [tabSetInitial, setTabSetInitial] = useState(!!accountInfo);

  useEffect(() => {
    if (!accountInfo) return;
    if (tabSetInitial) return;
    setTabSetInitial(true);
    if (!listsTab) setListsTab(accountInfo?.watchedListPages && accountInfo?.watchedListPages?.length > 0 ? accountInfo?.watchedListPages[0].title : '');
    if (!badgeTab) setBadgeTab(accountInfo?.watchedBadgePages && accountInfo?.watchedBadgePages?.length > 0 ? accountInfo?.watchedBadgePages[0].title : '');
  }, [accountInfo, badgeTab, listsTab, tabSetInitial]);

  useEffect(() => {
    if (listsTab !== '') {
      setAddPageIsVisible(false);
    }
  }, [listsTab]);

  const tabInfo = [];
  tabInfo.push(
    { key: 'collected', content: 'Badges', disabled: false },
    { key: 'lists', content: 'Lists' },
  )

  const badgePageTabInfo = []

  if (accountInfo?.watchedBadgePages) {
    for (const customPage of accountInfo?.watchedBadgePages) {
      badgePageTabInfo.push({ key: customPage.title, content: customPage.title, disabled: false });
    }
  }

  useEffect(() => {
    if (!accountInfo?.address) return;

    for (const id of filteredCollections) {
      fetchBalanceForUser(id.collectionId, accountInfo?.address);
    }
  }, [filteredCollections, accountInfo?.address]);

  let badgesToShow = useMemo(() => {


    let allBadgeIds: {
      collectionId: bigint
      badgeIds: UintRange<bigint>[]
    }[] = [];
    allBadgeIds.push(...deepCopy(accountInfo?.watchedBadgePages?.find(x => x.title === badgeTab)?.badges ?? []));

    if (filteredCollections.length > 0) {
      const filtered = [];
      for (const badgeIdObj of allBadgeIds) {
        for (const filteredCollection of filteredCollections) {
          const collectionId = filteredCollection.collectionId;
          if (badgeIdObj.collectionId === collectionId) {
            const [_, removed] = removeUintRangeFromUintRange(badgeIdObj.badgeIds, filteredCollection.badgeIds);
            badgeIdObj.badgeIds = removed;

            filtered.push(badgeIdObj);
          }
        }
      }
      allBadgeIds = filtered;

    }

    for (const badgeIdObj of allBadgeIds) {
      const collection = getCollection(badgeIdObj.collectionId);
      if (!collection) continue;
      const maxBadgeId = getTotalNumberOfBadges(collection);
      const [remaining] = removeUintRangeFromUintRange([{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }], badgeIdObj.badgeIds);
      badgeIdObj.badgeIds = remaining;
    }

    return allBadgeIds.filter(x => x.badgeIds.length > 0);
  }, [accountInfo, badgeTab, filteredCollections]);

  const [customView, setCustomView] = useState<AddressMappingWithMetadata<bigint>[]>([]);

  useEffect(() => {
    async function getCustomView() {
      const idsToFetch = [];

      idsToFetch.push(...accountInfo?.watchedListPages?.find(x => x.title === listsTab)?.mappingIds ?? []);

      const res = await getAddressMappings({ mappingIds: idsToFetch });
      setCustomView(res.addressMappings);
    }

    getCustomView();
  }, [listsTab, accountInfo?.watchedListPages]);

  const listsView = customView

  if (!accountInfo) {
    return <></>
  }

  return <>
    <Content
      style={{
        textAlign: 'center',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          marginLeft: '3vw',
          marginRight: '3vw',
          paddingLeft: '1vw',
          paddingRight: '1vw',
          paddingTop: '20px',
        }}
      >
        {/* Overview and Tabs */}
        <div className='flex-center primary-text' style={{ alignItems: 'center', marginBottom: 16, fontSize: 25, fontWeight: 'bolder' }}>
          Watchlists
        </div>

        <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} fullWidth />

        {((tab === 'collected') || (tab == 'hidden')) && (<>

          <br />
          <OptionsSelects
            searchValue={searchValue} setSearchValue={setSearchValue} filteredCollections={filteredCollections} setFilteredCollections={setFilteredCollections}
            editMode={editMode} setEditMode={setEditMode}
            cardView={cardView} setCardView={setCardView}
            groupByCollection={groupByCollection} setGroupByCollection={setGroupByCollection} addressOrUsername={chain.address as string} />
          <br />

          <div className='full-width flex-center flex-wrap'>
            {filteredCollections.map((filteredCollection, idx) => {
              return <BatchBadgeDetailsTag key={idx} badgeIdObj={filteredCollection} onClose={() => {
                setFilteredCollections(filteredCollections.filter(x => !compareObjects(x, filteredCollection)));
              }} />
            })}
          </div>
        </>)}

        {/* Tab Content */}
        {tab === 'collected' && (<>
          <div className=''>
            <div className='flex-center flex-wrap'>
              {
                <Tabs
                  onDeleteCurrTab={!editMode ? undefined : async (badgeTab: string) => {
                    const newCustomPages = deepCopy(accountInfo.watchedBadgePages ?? []);
                    newCustomPages.splice(newCustomPages.findIndex(x => x.title === badgeTab), 1);

                    await updateProfileInfo(chain.address, {
                      watchedBadgePages: newCustomPages
                    });
                  }}
                  tabInfo={
                    [
                      ...accountInfo.watchedBadgePages?.map((customPage) => {
                        return {
                          key: customPage.title, content: customPage.title, disabled: false
                        }
                      }) ?? [],
                    ]
                  }
                  tab={badgeTab}
                  setTab={setBadgeTab}
                  type={'underline'}
                />}
              {editMode && <IconButton src={!addPageIsVisible ? <PlusOutlined /> : <MinusOutlined />}
                text=''
                tooltipMessage='Add a new page to your portfolio.'
                onClick={() => {
                  setAddPageIsVisible(!addPageIsVisible);
                  setBadgeTab(''); //Reset tab
                }} />}
            </div>

            {badgeTab !== '' && accountInfo.watchedBadgePages?.find(x => x.title === badgeTab)?.description && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
              {accountInfo.watchedBadgePages?.find(x => x.title === badgeTab)?.description}
            </div>}

            {!(accountInfo.watchedBadgePages?.length) && !addPageIsVisible && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
              You have no custom pages. Sign in, go into customize mode, and click the plus button to add one.
            </div>}

            <br />

            {badgeTab != '' && editMode && <>
              <div className='flex-center'>

                <CustomizeAddRemoveBadgeFromPage onAdd={async (selectedBadge: BatchBadgeDetails) => {
                  let currCustomPageBadges = deepCopy(accountInfo?.watchedBadgePages?.find(x => x.title === badgeTab)?.badges ?? []);
                  currCustomPageBadges = addToArray(currCustomPageBadges, [selectedBadge]);


                  const currCustomPage = accountInfo?.watchedBadgePages?.find(x => x.title === badgeTab);
                  if (!currCustomPage) return;

                  await updateProfileInfo(chain.address, {
                    watchedBadgePages: accountInfo?.watchedBadgePages?.map(x => x.title === badgeTab ? { ...currCustomPage, badges: currCustomPageBadges } : x)
                  });

                }} onRemove={async (selectedBadge: BatchBadgeDetails) => {
                  let currCustomPageBadges = deepCopy(accountInfo?.watchedBadgePages?.find(x => x.title === badgeTab)?.badges ?? []);
                  currCustomPageBadges = removeFromArray(currCustomPageBadges, [selectedBadge]);


                  const currCustomPage = accountInfo?.watchedBadgePages?.find(x => x.title === badgeTab);
                  if (!currCustomPage) return;

                  await updateProfileInfo(chain.address, {
                    watchedBadgePages: accountInfo?.watchedBadgePages?.map(x => x.title === badgeTab ? { ...currCustomPage, badges: currCustomPageBadges } : x)
                  });
                }} />
              </div></>}

            <NewPageInputForm visible={addPageIsVisible} setVisible={setAddPageIsVisible} onAddPage={async (
              newPageTitle: string,
              newPageDescription: string,
            ) => {
              const newCustomPages = deepCopy(accountInfo.watchedBadgePages ?? []);
              newCustomPages.push({
                title: newPageTitle,
                description: newPageDescription,
                badges: []
              });

              await updateProfileInfo(chain.address, {
                watchedBadgePages: newCustomPages
              });

              setBadgeTab(newPageTitle);

            }} />


            {badgeTab !== '' && <>
              <BadgeInfiniteScroll
                fetchMore={async () => { }}
                hasMore={false}
                cardView={cardView}
                groupByCollection={groupByCollection}
                addressOrUsername={accountInfo?.address ?? ''}
                editMode={editMode}
                badgesToShow={badgesToShow}
                isWatchlist
              />

            </>}
          </div>
        </>)}

        {tab === 'lists' && (<>
          <br />
          <OptionsSelects
            isListsSelect
            searchValue={searchValue} setSearchValue={setSearchValue} filteredCollections={filteredCollections} setFilteredCollections={setFilteredCollections}
            editMode={editMode} setEditMode={setEditMode}
            cardView={cardView} setCardView={setCardView} groupByCollection={groupByCollection} setGroupByCollection={setGroupByCollection} addressOrUsername={chain.address as string} />
          <br />

          <div className='flex-center'>
            <Tabs
              onDeleteCurrTab={!editMode ? undefined : async (listsTab: string) => {
                const newCustomPages = deepCopy(accountInfo.watchedListPages ?? []);
                newCustomPages.splice(newCustomPages.findIndex(x => x.title === listsTab), 1);

                await updateProfileInfo(chain.address, {
                  watchedListPages: newCustomPages
                });
              }}
              tabInfo={
                [
                  ...accountInfo.watchedListPages?.map((customPage) => {
                    return {
                      key: customPage.title, content: customPage.title, disabled: false
                    }
                  }) ?? []
                ]
              }
              tab={listsTab} setTab={(e) => {
                setListsTab(e as AccountViewKey);
              }}
              type='underline'
            />

            {editMode && <IconButton src={!addPageIsVisible ? <PlusOutlined /> : <MinusOutlined />}
              text=''
              tooltipMessage='Add a new page to your portfolio.'
              onClick={() => {
                setAddPageIsVisible(!addPageIsVisible);
                setListsTab(''); //Reset tab
              }} />}
          </div>
          {listsTab !== '' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            {accountInfo.watchedListPages?.find(x => x.title === badgeTab)?.description}
          </div>}

          {!(accountInfo.watchedListPages?.length) && !addPageIsVisible && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            You have no custom pages. Sign in, go into customize mode, and click the plus button to add one.
          </div>}
          {listsTab != '' && editMode && <>

            <div className='flex-center'>
              <CustomizeAddRemoveListFromPage addressOrUsername={accountInfo.address}
                onAdd={async (selectedList: string) => {
                  let currCustomPageLists = deepCopy(accountInfo?.watchedListPages?.find(x => x.title === listsTab)?.mappingIds ?? []);

                  currCustomPageLists = currCustomPageLists.concat([selectedList]);


                  const currCustomPage = accountInfo?.watchedListPages?.find(x => x.title === listsTab);
                  if (!currCustomPage) return;

                  await updateProfileInfo(chain.address, {
                    watchedListPages: accountInfo?.watchedListPages?.map(x => x.title === listsTab ? { ...currCustomPage, mappingIds: currCustomPageLists } : x)
                  });
                }} onRemove={async (selectedList: string) => {
                  let currCustomPageLists = deepCopy(accountInfo?.watchedListPages?.find(x => x.title === listsTab)?.mappingIds ?? []);
                  currCustomPageLists = currCustomPageLists.filter(x => x !== selectedList);


                  const currCustomPage = accountInfo?.watchedListPages?.find(x => x.title === listsTab);
                  if (!currCustomPage) return;

                  await updateProfileInfo(chain.address, {
                    watchedListPages: accountInfo?.watchedListPages?.map(x => x.title === listsTab ? { ...currCustomPage, mappingIds: currCustomPageLists } : x)
                  });

                }} />
            </div></>}


          <NewPageInputForm

            visible={addPageIsVisible} setVisible={setAddPageIsVisible}
            onAddPage={async (
              newPageTitle: string,
              newPageDescription: string,
            ) => {
              const newCustomPages = deepCopy(accountInfo.watchedListPages ?? []);
              newCustomPages.push({
                title: newPageTitle,
                description: newPageDescription,
                mappingIds: []
              });

              await updateProfileInfo(chain.address, {
                watchedListPages: newCustomPages
              });

              setListsTab(newPageTitle);
            }} />

          {listsTab !== '' && <>
            <ListInfiniteScroll
              fetchMore={async () => { }}
              hasMore={false}
              listsView={listsView}
              addressOrUsername={accountInfo?.address ?? ''}
              showInclusionDisplay={false}
            />
          </>}
        </>)}

      </div>
      <DevMode obj={accountInfo} />
      <Divider />
    </Content >
  </>
}

export default WatchlistPage;
