import { CloseCircleOutlined, DeleteOutlined, DownOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Col, Divider, Dropdown, Empty, Input, Layout, Select, Spin, Tag, Typography, notification } from 'antd';
import { UintRange, deepCopy } from 'bitbadgesjs-proto';
import { AccountViewKey, Numberify, getMetadataForBadgeId, isFullUintRanges, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';


import { fetchAccounts, fetchNextForAccountViews, getAccountActivityView, getAccountAddressMappingsView, getAccountBalancesView, updateProfileInfo, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, getCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { AddressListCard } from '../../components/badges/AddressListCard';
import { BadgeAvatar } from '../../components/badges/BadgeAvatar';
import { MultiCollectionBadgeDisplay } from "../../components/badges/MultiCollectionBadgeDisplay";
import { AccountButtonDisplay } from '../../components/button-displays/AccountButtonDisplay';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { DevMode } from '../../components/common/DevMode';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { SearchDropdown } from '../../components/navigation/SearchDropdown';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../constants';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;

function PortfolioPage() {
  const router = useRouter();

  const chain = useChainContext();



  const { addressOrUsername } = router.query;
  const accountInfo = useAccount(addressOrUsername as string);
  const [tab, setTab] = useState(accountInfo?.readme ? 'overview' : 'collected');
  const [addPageIsVisible, setAddPageIsVisible] = useState(false);

  const [newPageTitle, setNewPageTitle] = useState('');
  const [warned, setWarned] = useState(false);

  useEffect(() => {
    if (tab === 'managing' || tab === 'createdBy') {
      setEditMode(false);
    }
    setNumBadgesDisplayed(25);
  }, [tab]);

  useEffect(() => {
    if (accountInfo?.cosmosAddress === chain.cosmosAddress && !chain.loggedIn && chain.cosmosAddress && !warned) {
      notification.info({
        message: 'Note that you must sign in to customize your portfolio.',
      });
      setWarned(true);
    }
  }, [accountInfo, chain, warned]);

  const [badgeTab, setBadgeTab] = useState('All');

  useEffect(() => {
    if (badgeTab !== '') {
      setAddPageIsVisible(false);
    }
    setNumBadgesDisplayed(25);
  }, [badgeTab]);

  const [cardView, setCardView] = useState(true);
  const [filteredCollections, setFilteredCollections] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]);
  const [groupByCollection, setGroupByCollection] = useState(false);

  const [numBadgesDisplayed, setNumBadgesDisplayed] = useState<number>(25);
  const [editMode, setEditMode] = useState(false);
  const [listsTab, setListsTab] = useState<AccountViewKey>('addressMappings');
  const [searchValue, setSearchValue] = useState<string>('');


  const tabInfo = [];
  if (accountInfo?.readme) {
    tabInfo.push({ key: 'overview', content: 'Overview', disabled: false });
  }

  tabInfo.push(
    { key: 'collected', content: 'Badges', disabled: false },
    { key: 'lists', content: 'Lists' },
    { key: 'managing', content: 'Managing', disabled: false },
    { key: 'createdBy', content: 'Created', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'reputation', content: 'Reviews' },
  )



  const badgePageTabInfo = [
    { key: 'collected', content: 'All', disabled: false },
  ]

  if (accountInfo?.customPages) {
    for (const customPage of accountInfo?.customPages) {
      badgePageTabInfo.push({ key: customPage.title, content: customPage.title, disabled: false });
    }
  }

  const SearchBar = <Input
    defaultValue=""
    placeholder="Filter by collection or badge"
    value={searchValue}
    onChange={async (e) => {
      setSearchValue(e.target.value);
    }}
    className='form-input'
    style={{}}
  />;

  const FilterSearchDropdown = <Dropdown
    open={searchValue !== ''}
    placement="bottom"
    overlay={
      <SearchDropdown
        onlyCollections
        onSearch={async (searchValue: any, _isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
          if (typeof searchValue === 'string') {
            if (isCollection) {
              setFilteredCollections([...filteredCollections, {
                collectionId: BigInt(searchValue),
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }]
              }]);
            } else if (isBadge) {
              const collectionId = BigInt(searchValue.split('/')[0]);
              const badgeId = BigInt(searchValue.split('/')[1]);

              setFilteredCollections([...filteredCollections, {
                collectionId,
                badgeIds: [{ start: badgeId, end: badgeId }]
              }]);
            }

            setSearchValue('');
          }
        }}
        searchValue={searchValue}
      />
    }
    overlayClassName='primary-text inherit-bg'
    className='inherit-bg'
    trigger={['hover', 'click']}
  >
    {SearchBar}
  </Dropdown >

  useEffect(() => {
    if (!accountInfo?.address) return;

    for (const id of filteredCollections) {
      fetchBalanceForUser(id.collectionId, accountInfo?.address);
    }
  }, [filteredCollections, accountInfo?.address]);

  let badgesToShow = useMemo(() => {

    let badgesToShow = getAccountBalancesView(accountInfo, 'badgesCollected')

    const allBadgeIds: {
      collectionId: bigint
      badgeIds: UintRange<bigint>[]
    }[] = [];
    if (badgeTab === 'Hidden') {
      allBadgeIds.push(...deepCopy(accountInfo?.hiddenBadges ?? []));
    } else if (badgeTab === 'All') {
      for (const balanceInfo of badgesToShow) {
        if (!balanceInfo) {
          continue;
        }

        allBadgeIds.push(deepCopy({
          badgeIds: balanceInfo.balances.map(balance => balance.badgeIds).flat() || [],
          collectionId: balanceInfo.collectionId
        }));
      }
    } else {
      allBadgeIds.push(...deepCopy(accountInfo?.customPages?.find(x => x.title === badgeTab)?.badges ?? []))
    }

    if (filteredCollections.length > 0) {
      for (const filteredCollection of filteredCollections) {
        const collectionId = filteredCollection.collectionId;
        const matchingObj = allBadgeIds.find(x => x.collectionId === collectionId);
        if (matchingObj) {
          const [_, removed] = removeUintRangeFromUintRange(filteredCollection.badgeIds, matchingObj.badgeIds);
          matchingObj.badgeIds = removed;
        }
      }
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

  const numTotalBadges = useMemo(() => {

    //Calculate badge IDs for each collection


    //Calculate total number of badge IDs
    let total = 0n;
    for (const obj of badgesToShow) {
      for (const range of obj.badgeIds) {
        const numBadgesInRange = range.end - range.start + 1n;
        total += numBadgesInRange;
      }
    }

    return Numberify(total);
  }, [badgesToShow]);

  const fetchMoreCollected = useCallback(async (address: string) => {
    await fetchNextForAccountViews(address, editMode ? ['badgesCollectedWithHidden'] : ['badgesCollected']);
  }, [editMode]);

  const fetchMoreLists = useCallback(async (address: string, viewKey: AccountViewKey) => {
    await fetchNextForAccountViews(address, [viewKey]);
  }, []);

  const fetchMoreCreatedBy = useCallback(async (address: string, viewKey: AccountViewKey) => {
    await fetchNextForAccountViews(address, [viewKey]);
  }, []);

  const fetchMoreManaging = useCallback(async (address: string, viewKey: AccountViewKey) => {
    await fetchNextForAccountViews(address, [viewKey]);
  }, []);

  const listsView = getAccountAddressMappingsView(accountInfo, listsTab);
  const collectedHasMore = editMode ? accountInfo?.views['badgesCollectedWithHidden']?.pagination?.hasMore ?? true :
    accountInfo?.views['badgesCollected']?.pagination?.hasMore ?? true;


  const createdView = accountInfo?.views['createdBy'];
  const hasMoreAddressMappings = accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch more collected');

    //Fetch on tab change but only if empty and has mroe
    const collectedIsEmpty = !accountInfo?.views['badgesCollected']?.ids.length;
    const listsIsEmpty = !accountInfo?.views['addressMappings']?.ids.length;
    const createdByIsEmpty = !accountInfo?.views['createdBy']?.ids.length;
    const managingIsEmpty = !accountInfo?.views['managing']?.ids.length;
    const hasMoreAddressMappings = accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true;

    if (!accountInfo || !accountInfo.address) return;
    if (tab === 'collected' && collectedIsEmpty && (accountInfo?.views['badgesCollected']?.pagination?.hasMore ?? true)) {
      fetchMoreCollected(accountInfo?.address ?? '');
    } else if (tab === 'lists' && hasMoreAddressMappings && listsIsEmpty) {
      fetchMoreLists(accountInfo?.address ?? '', listsTab);
    } else if (tab === 'createdBy' && (accountInfo?.views['createdBy']?.pagination?.hasMore ?? true) && createdByIsEmpty) {
      fetchMoreCreatedBy(accountInfo?.address ?? '', 'createdBy');
    } else if (tab === 'managing' && (accountInfo?.views['managing']?.pagination?.hasMore ?? true) && managingIsEmpty) {
      fetchMoreManaging(accountInfo?.address ?? '', 'managing');
    }
  }, [tab, accountInfo, fetchMoreLists, fetchMoreCreatedBy, fetchMoreManaging, fetchMoreCollected, listsTab]);


  useEffect(() => {
    if (tab === 'lists') {
      const listsView = getAccountAddressMappingsView(accountInfo, listsTab);
      const createdBys = listsView.map((addressMapping) => addressMapping.createdBy);
      fetchAccounts([...new Set(createdBys)]);
    }
  }, [tab, accountInfo, listsTab]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;

      await fetchAccounts([addressOrUsername as string]);
    }
    getPortfolioInfo();
  }, [addressOrUsername]);




  const [reactElement, setReactElement] = useState<ReactElement | null>(null);

  useLayoutEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get readme');
    const HtmlToReactParser = HtmlToReact.Parser();
    const reactElement = HtmlToReactParser.parse(mdParser.render(accountInfo?.readme ? accountInfo?.readme : ''));
    setReactElement(reactElement);
  }, [accountInfo?.readme]);

  const [customizeSearchValue, setCustomizeSearchValue] = useState<string>('');

  interface BadgeIdObj {
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }
  const addToArray = (arr: BadgeIdObj[], badgeIdObjsToAdd: BadgeIdObj[]) => {
    for (const badgeIdObj of badgeIdObjsToAdd) {
      const badgeIdsToAdd = badgeIdObj.badgeIds;
      const existingIdx = arr.findIndex(x => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].badgeIds = sortUintRangesAndMergeIfNecessary([...arr[existingIdx].badgeIds, ...badgeIdsToAdd], true)
      } else {
        arr.push({
          collectionId: badgeIdObj.collectionId,
          badgeIds: badgeIdsToAdd
        })
      }
    }

    return arr.filter(x => x.badgeIds.length > 0);
  }

  const CustomizeSearchBar = <Input
    defaultValue=""
    placeholder="Add by searching a collection or badge"
    value={customizeSearchValue}
    onChange={async (e) => {
      setCustomizeSearchValue(e.target.value);
    }}
    className='form-input'
    style={{}}
  />;

  const CustomizeSearchDropdown = <Dropdown
    open={customizeSearchValue !== ''}
    placement="bottom"
    overlay={
      <SearchDropdown
        onlyCollections
        onSearch={async (searchValue: any, _isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
          if (typeof searchValue === 'string') {
            let currCustomPageBadges = badgeTab == 'Hidden' ? deepCopy(accountInfo?.hiddenBadges ?? []) :
              deepCopy(accountInfo?.customPages?.find(x => x.title === badgeTab)?.badges ?? []);



            if (isCollection) {
              currCustomPageBadges = addToArray(currCustomPageBadges, [{
                collectionId: BigInt(searchValue),
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }]
              }]);
            } else if (isBadge) {
              const collectionId = BigInt(searchValue.split('/')[0]);
              const badgeId = BigInt(searchValue.split('/')[1]);

              currCustomPageBadges = addToArray(currCustomPageBadges, [{
                collectionId,
                badgeIds: [{ start: badgeId, end: badgeId }]
              }]);
            }

            if (badgeTab == 'Hidden') {
              await updateProfileInfo(chain.address, {
                hiddenBadges: currCustomPageBadges
              });
            } else {
              const currCustomPage = accountInfo?.customPages?.find(x => x.title === badgeTab);
              if (!currCustomPage) return;

              await updateProfileInfo(chain.address, {
                customPages: accountInfo?.customPages?.map(x => x.title === badgeTab ? { ...currCustomPage, badges: currCustomPageBadges } : x)
              });
            }

            setCustomizeSearchValue('');
          }
        }}
        searchValue={customizeSearchValue}
      />
    }
    overlayClassName='primary-text inherit-bg'
    className='inherit-bg'
    trigger={['hover', 'click']}
  >
    {CustomizeSearchBar}
  </Dropdown >


  if (!accountInfo) {
    return <></>
  }


  return (
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
        {accountInfo && <AccountButtonDisplay addressOrUsername={accountInfo.address} />}

        <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} fullWidth />
        {tab === 'overview' && (<>
          <br />
          <InformationDisplayCard
            span={24}
            title="About"
          >
            <div style={{ overflow: 'auto' }} >
              <div className='custom-html-style primary-text' id="description">
                {/* <Markdown> */}
                {reactElement}
                {/* </Markdown> */}
              </div>
            </div>
          </InformationDisplayCard>
        </>)}
        {((tab === 'collected') || (tab == 'hidden')) && (<>

          <br />
          <div className='flex-wrap full-width flex' style={{ flexDirection: 'row-reverse' }}>
            {chain.address === accountInfo.address && chain.loggedIn && (
              <div className='primary-text inherit-bg' style={{
                float: 'right',
                display: 'flex',
                alignItems: 'center',
                marginRight: 16,
                marginTop: 5,
              }}>
                Mode:

                <Select
                  className='selector primary-text inherit-bg'
                  value={editMode ? 'edit' : 'none'}
                  placeholder="Default: None"
                  onChange={(e: any) => {
                    setEditMode(e === 'edit');
                    setCardView(true);
                  }}
                  style={{
                    float: 'right',
                    marginLeft: 8,
                  }}
                  suffixIcon={
                    <DownOutlined
                      className='primary-text'
                    />
                  }
                >
                  <Select.Option value="none">Normal User</Select.Option>
                  <Select.Option value="edit">Customize</Select.Option>
                </Select>
              </div>
            )}

            {<div className='primary-text inherit-bg' style={{
              float: 'right',
              display: 'flex',
              alignItems: 'center',
              marginRight: 16,
              marginTop: 5,
            }}>
              Group By:

              <Select
                className='selector primary-text inherit-bg'
                value={groupByCollection ? 'collection' : 'none'}
                placeholder="Default: None"
                onChange={(e: any) => {
                  setGroupByCollection(e === 'collection');
                }}
                style={{
                  float: 'right',
                  marginLeft: 8,
                  minWidth: 90
                }}
                suffixIcon={
                  <DownOutlined
                    className='primary-text'
                  />
                }
              >
                <Select.Option value="none">None</Select.Option>
                <Select.Option value="collection">Collection</Select.Option>
              </Select>
            </div>
            }

            {!editMode && <div className='primary-text inherit-bg'
              style={{
                float: 'right',
                display: 'flex',
                alignItems: 'center',
                marginLeft: 16,
                marginRight: 16,
                marginTop: 5,
              }}>
              View:

              <Select
                className="selector primary-text inherit-bg"
                value={cardView ? 'card' : 'image'}
                placeholder="Default: None"
                onChange={(e: any) => {
                  setCardView(e === 'card');
                }}
                style={{
                  float: 'right',
                  marginLeft: 8
                }}
                suffixIcon={
                  <DownOutlined
                    className='primary-text'
                  />
                }
              >
                <Select.Option value="card">Card</Select.Option>
                <Select.Option value="image">Image</Select.Option>
              </Select>
            </div>}
            {tab != 'hidden' && <>
              <div className='primary-text inherit-bg'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  // marginLeft: 16,
                  marginRight: 16,
                  marginTop: 5,
                  flexGrow: 1
                }}>
                {FilterSearchDropdown}

              </div>
            </>}

          </div>
          <br />

          <div className='full-width flex-center flex-wrap'>
            {filteredCollections.map((filteredCollection, idx) => {
              const collection = getCollection(filteredCollection.collectionId);
              const metadata = isFullUintRanges(filteredCollection.badgeIds) ? collection?.cachedCollectionMetadata
                : getMetadataForBadgeId(filteredCollection.badgeIds[0].start, collection?.cachedBadgeMetadata ?? []);
              return <Tag
                className='primary-text inherit-bg flex-between'
                style={{ alignItems: 'center', marginBottom: 8 }}
                key={idx}
                closable
                closeIcon={<CloseCircleOutlined
                  className='primary-text styled-button flex-center'
                  style={{ border: "none", fontSize: 16, alignContent: 'center', marginLeft: 5 }}
                  size={50}
                />}
                onClose={() => {
                  setFilteredCollections(filteredCollections.filter(x => !compareObjects(x, filteredCollection)));
                }}
              >
                <div className='primary-text inherit-bg' style={{ alignItems: 'center', marginRight: 4, maxWidth: 280 }}>
                  <div className='flex-center' style={{ alignItems: 'center', maxWidth: 280 }}>
                    <div>
                      <BadgeAvatar
                        size={30}
                        noHover
                        collectionId={filteredCollection.collectionId}
                        metadataOverride={metadata}
                      />
                    </div>
                    <Typography.Text className="primary-text" style={{ fontSize: 16, fontWeight: 'bold', margin: 4, overflowWrap: 'break-word', }}>
                      <div style={{ marginBottom: 4 }}>
                        {metadata?.name}
                      </div>
                      <div style={{ fontSize: 12 }}>
                        Collection ID: {filteredCollection.collectionId.toString()}
                        <br />

                        {isFullUintRanges(filteredCollection.badgeIds) ? 'All' : `Badge IDs: ${filteredCollection.badgeIds.map(x =>
                          x.start === x.end ? `${x.start}` :
                            `${x.start}-${x.end}`).join(', ')}`}
                      </div>
                    </Typography.Text>
                  </div>
                </div>
                <br />


              </Tag>
            })}
          </div>


        </>)}

        {/* Tab Content */}
        {tab === 'collected' && (<>
          <div className=''>
            <div className='flex-center flex-wrap'>
              {((accountInfo.customPages?.filter(x => x.badges.length > 0) ?? [])?.length > 0 || editMode) &&
                <Tabs
                  tabInfo={
                    [
                      {
                        key: 'All', content: 'All', disabled: false
                      },

                      ...(editMode ? [{
                        key: 'Hidden', content: 'Hidden', disabled: false
                      }] : []),
                      ...(accountInfo.customPages?.filter(x => editMode || x.badges.length > 0) ?? [])?.map((customPage) => {
                        return {
                          key: customPage.title, content:
                            <div className='flex-center' style={{ marginLeft: editMode ? 8 : undefined }}>
                              {customPage.title}
                              {editMode && badgeTab !== 'All' && badgeTab !== 'Hidden' && badgeTab !== '' && badgeTab === customPage.title && <>


                                <IconButton
                                  text=''
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this page?')) {
                                      return
                                    }

                                    const newCustomPages = deepCopy(accountInfo.customPages ?? []);
                                    newCustomPages.splice(newCustomPages.findIndex(x => x.title === badgeTab), 1);

                                    await updateProfileInfo(chain.address, {
                                      customPages: newCustomPages
                                    });

                                    setBadgeTab('All');
                                  }}
                                  src={<DeleteOutlined />}
                                />
                              </>}
                            </div>, disabled: false
                        }
                      }) ?? [],
                    ]
                  }

                  tab={badgeTab}
                  setTab={setBadgeTab}
                  type={'underline'}
                />}
              {editMode && <IconButton src={<PlusOutlined />}
                text=''
                tooltipMessage='Add a new page to your portfolio.'
                onClick={() => {
                  setAddPageIsVisible(true);
                  setBadgeTab(''); //Reset tab
                }} />}
            </div>

            {badgeTab === 'Hidden' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
              <InfoCircleOutlined /> Hidden badges will be automatically filtered out from standard views and not shown by default.
            </div>}

            <br />

            {badgeTab != 'All' && badgeTab != '' && editMode && <>
              <div className='flex-center'>
                <Col md={12} xs={24} style={{ marginBottom: 8 }}>
                  {CustomizeSearchDropdown}
                </Col>

              </div> <Divider /></>}

            {addPageIsVisible && <div className='flex-center '>
              <Col md={12} xs={24} style={{ marginBottom: 8 }}>
                <Input

                  defaultValue=""
                  placeholder="Page Name"
                  className='form-input'
                  style={{
                    maxWidth: 300,
                    marginRight: 8
                  }}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                  }}
                />
                <br />
                <br />
                <div className='flex-center'>
                  <button className='landing-button' onClick={async () => {
                    const newCustomPages = deepCopy(accountInfo.customPages ?? []);
                    newCustomPages.push({
                      title: newPageTitle,
                      description: '',
                      badges: []
                    });

                    await updateProfileInfo(chain.address, {
                      customPages: newCustomPages
                    });

                    setAddPageIsVisible(false);
                    setBadgeTab(newPageTitle);
                  }}>
                    Add Page
                  </button>
                </div>
              </Col>
            </div>}


            {/* {filteredCollections.length == 0 && (accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.map((collection) => collection.collectionId) ?? []).length > 0 &&
              accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.some((collection) => collection.badgeIds.length > 0)
              && <>
                <InfiniteScroll
                  dataLength={!groupByCollection ? numBadgesDisplayed : badgesToShow.length}
                  next={async () => {
                    if (numBadgesDisplayed + 25 > numTotalBadges || groupByCollection) {
                      await fetchMoreCollected(accountInfo?.address ?? '');
                    }

                    if (!groupByCollection) {
                      if (numBadgesDisplayed + 25 > numTotalBadges) {
                        setNumBadgesDisplayed(numBadgesDisplayed + 25);
                      } else if (numBadgesDisplayed + 100 <= numTotalBadges) {
                        setNumBadgesDisplayed(numBadgesDisplayed + 100);
                      } else {
                        setNumBadgesDisplayed(numTotalBadges + 25);
                      }
                    }
                  }}
                  hasMore={(!groupByCollection && numBadgesDisplayed < numTotalBadges)}
                  loader={<div>
                    <br />
                    <Spin size={'large'} />
                  </div>}
                  scrollThreshold={"300px"}
                  endMessage={
                    <></>
                  }
                  initialScrollY={0}
                  style={{ width: '100%', overflow: 'hidden' }}
                >
                  <MultiCollectionBadgeDisplay
                    collectionIds={accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.map((collection) => collection.collectionId) ?? []}
                    customPageBadges={accountInfo.customPages?.find(x => x.title === badgeTab)?.badges ?? []}
                    cardView={cardView}
                    groupByCollection={groupByCollection}
                    defaultPageSize={groupByCollection ? (accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.map((collection) => collection.collectionId) ?? []).length : numBadgesDisplayed}
                    hidePagination={true}
                    addressOrUsernameToShowBalance={accountInfo.address}
                    showCustomizeButtons={editMode}
                  />
                </InfiniteScroll>
              </>
            } */}
            {<>
              <InfiniteScroll
                dataLength={!groupByCollection ? numBadgesDisplayed : badgesToShow.length}
                next={async () => {
                  if (numBadgesDisplayed + 25 > numTotalBadges || groupByCollection) {
                    await fetchMoreCollected(accountInfo?.address ?? '');
                  }

                  if (!groupByCollection) {
                    if (numBadgesDisplayed + 25 > numTotalBadges) {
                      setNumBadgesDisplayed(numBadgesDisplayed + 25);
                    } else if (numBadgesDisplayed + 100 <= numTotalBadges) {
                      setNumBadgesDisplayed(numBadgesDisplayed + 100);
                    } else {
                      setNumBadgesDisplayed(numTotalBadges + 25);
                    }
                  }
                }}
                hasMore={collectedHasMore || (!groupByCollection && numBadgesDisplayed < numTotalBadges)}
                loader={<div>
                  <br />
                  <Spin size={'large'} />
                </div>}
                scrollThreshold={"300px"}
                endMessage={
                  <></>
                }
                initialScrollY={0}
                style={{ width: '100%', overflow: 'hidden' }}
              >
                <MultiCollectionBadgeDisplay
                  collectionIds={badgesToShow.map((collection) => collection.collectionId)}
                  addressOrUsernameToShowBalance={accountInfo.address}
                  customPageBadges={badgesToShow}
                  cardView={cardView}
                  groupByCollection={groupByCollection}
                  defaultPageSize={groupByCollection ? badgesToShow.length : numBadgesDisplayed}
                  hidePagination={true}
                  showCustomizeButtons={editMode}
                />
              </InfiniteScroll>

              {badgesToShow.every((collection) => collection.badgeIds.length === 0) && !collectedHasMore && (
                <Empty
                  className='primary-text'
                  description={
                    <span>
                      No badges found.
                    </span>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}


            </>}
          </div>
        </>)}

        {tab === 'lists' && (<>
          <br />
          <div className='flex-center'>
            <Tabs
              tabInfo={
                [
                  { key: 'addressMappings', content: 'All', disabled: false },
                  { key: 'explicitlyIncludedAddressMappings', content: 'Included', disabled: false },
                  { key: 'explicitlyExcludedAddressMappings', content: 'Excluded', disabled: false },
                ]
              }
              tab={listsTab} setTab={(e) => {
                setListsTab(e as AccountViewKey);
              }}
              type='underline'
            />
          </div>
          <br />
          <div className='flex-center flex-wrap'>
            <InfiniteScroll
              dataLength={listsView.length}
              next={async () => fetchMoreLists(accountInfo?.address ?? '', listsTab)}
              hasMore={hasMoreAddressMappings}
              loader={<div>
                <br />
                <Spin size={'large'} />
              </div>}
              scrollThreshold={"300px"}
              endMessage={
                <></>
              }
              initialScrollY={0}
              style={{ width: '100%', overflow: 'hidden' }}
            >
              <div className='full-width flex-center flex-wrap'>
                {listsView.map((addressMapping, idx) => {
                  return <AddressListCard
                    key={idx}
                    addressMapping={addressMapping}
                    addressOrUsername={accountInfo.address}
                  />
                })}
              </div>
            </InfiniteScroll>

            {listsView.length === 0 && !hasMoreAddressMappings && (
              <Empty
                className='primary-text'
                description={
                  <span>
                    No lists found.
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </>)}

        {tab === 'reputation' && (<>
          <ReputationTab
            reviews={accountInfo?.reviews ?? []}
            fetchMore={async () => {
              await fetchNextForAccountViews(accountInfo?.address ?? '', ['latestReviews']);
            }}
            hasMore={accountInfo?.views['latestReviews']?.pagination?.hasMore ?? true}
            addressOrUsername={accountInfo?.address ?? ''}
          />
        </>
        )}


        {tab === 'activity' && (<>
          <br />
          <ActivityTab
            activity={getAccountActivityView(accountInfo, 'latestActivity') ?? []}
            fetchMore={async () => fetchNextForAccountViews(accountInfo?.address ?? '', ['latestActivity'])}
            hasMore={accountInfo?.views['latestActivity']?.pagination?.hasMore ?? true}
          />
        </>
        )}

        {tab === 'createdBy' && (<>
          <br />
          <div className='flex-center flex-wrap'>
            <InfiniteScroll
              dataLength={createdView?.ids.length ?? 0}
              next={async () => fetchMoreCreatedBy(accountInfo?.address ?? '', 'createdBy')}
              hasMore={createdView?.pagination?.hasMore ?? true}
              loader={<div>
                <br />
                <Spin size={'large'} />
              </div>}
              scrollThreshold={"300px"}
              endMessage={
                <></>
              }
              initialScrollY={0}
              style={{ width: '100%', overflow: 'hidden' }}
            >
              <div className='full-width flex-center flex-wrap' style={{ alignItems: 'normal' }}>
                <MultiCollectionBadgeDisplay
                  collectionIds={createdView?.ids.map(x => BigInt(x)) ?? []}
                  cardView={cardView}
                  groupByCollection={true}
                  defaultPageSize={cardView ? 1 : 10}
                  hidePagination={true}
                  hideAddress
                  showCustomizeButtons={editMode}
                />
              </div>
            </InfiniteScroll>

            {accountInfo?.views['createdBy']?.ids.length == 0 && !accountInfo?.views['createdBy']?.pagination?.hasMore && (
              <Empty
                className='primary-text'
                description={
                  <span>
                    No badges found.
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </>)}

        {tab === 'managing' && (<>
          <br />
          <div className='flex-center flex-wrap'>
            <InfiniteScroll
              dataLength={accountInfo?.views['managing']?.ids.length ?? 0}
              next={async () => fetchMoreManaging(accountInfo?.address ?? '', 'managing')}
              hasMore={accountInfo?.views['managing']?.pagination?.hasMore ?? true}
              loader={<div>
                <br />
                <Spin size={'large'} />
              </div>}
              scrollThreshold={"300px"}
              endMessage={
                <></>
              }
              initialScrollY={500}
              style={{ width: '100%', overflow: 'hidden', }}
            >
              <div className='full-width flex-center flex-wrap' style={{ alignItems: 'normal' }}>
                <MultiCollectionBadgeDisplay
                  collectionIds={accountInfo?.views['managing']?.ids.map(x => BigInt(x)) ?? []}
                  cardView={cardView}
                  groupByCollection={true}
                  defaultPageSize={cardView ? 1 : 10}
                  // defaultPageSize={groupByCollection ? badgesToShow.length : numBadgesDisplayed}
                  hidePagination={true}
                  hideAddress

                  showCustomizeButtons={editMode}
                />
              </div>
            </InfiniteScroll>

            {accountInfo?.views['managing']?.ids.length == 0 && !accountInfo?.views['managing']?.pagination?.hasMore && (
              <Empty
                className='primary-text'
                description={
                  <span>
                    No badges found.
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </>)}

      </div>
      <DevMode obj={accountInfo} />
      <Divider />
    </Content >
  );
}

export default PortfolioPage;
