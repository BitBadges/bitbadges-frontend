import { CloseCircleOutlined, DownOutlined } from '@ant-design/icons';
import { faThumbTack } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Divider, Dropdown, Empty, Input, Layout, Select, Spin, Tag, Typography } from 'antd';
import { UintRange } from 'bitbadgesjs-proto';
import { AccountViewKey, Numberify, getMetadataForBadgeId, isFullUintRanges, removeUintRangeFromUintRange } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTotalNumberOfBadgeIds } from '../../bitbadges-api/utils/badges';
import { AddressListCard } from '../../components/badges/AddressListCard';
import { BadgeAvatar } from '../../components/badges/BadgeAvatar';
import { MultiCollectionBadgeDisplay } from "../../components/badges/MultiCollectionBadgeDisplay";
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { AccountButtonDisplay } from '../../components/button-displays/AccountButtonDisplay';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { DevMode } from '../../components/common/DevMode';
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
  const accounts = useAccountsContext();
  const chain = useChainContext();
  const collections = useCollectionsContext();


  const { addressOrUsername } = router.query;
  const accountInfo = typeof addressOrUsername === 'string' ? accounts.getAccount(addressOrUsername) : undefined;
  const [tab, setTab] = useState(accountInfo?.readme ? 'overview' : 'collected');

  const badgeTab = 'Pinned Badges';
  const [cardView, setCardView] = useState(true);
  const [filteredCollections, setFilteredCollections] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]);
  const [groupByCollection, setGroupByCollection] = useState(false);

  const [numBadgesDisplayed, setNumBadgesDisplayed] = useState<number>(25);
  const [numTotalBadges, setNumTotalBadges] = useState<number>(25);
  const [hiddenBadgesDisplayed, setHiddenBadgesDisplayed] = useState<number>(25);

  const [editMode, setEditMode] = useState(false);
  const [listsTab, setListsTab] = useState<AccountViewKey>('addressMappings');
  const [searchValue, setSearchValue] = useState<string>('');

  const showHidden = false;


  const tabInfo = [];
  if (accountInfo?.readme) {
    tabInfo.push({ key: 'overview', content: 'Overview', disabled: false });
  }

  tabInfo.push(
    { key: 'collected', content: 'Collected', disabled: false },
    { key: 'lists', content: 'Lists' },
    { key: 'managing', content: 'Managing', disabled: false },
    { key: 'createdBy', content: 'Created', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'reputation', content: 'Reviews' },
  )

  if (accountInfo?.address === chain.address) {
    tabInfo.push(
      { key: 'hidden', content: 'Hidden', disabled: false },
    )
  }

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
    overlayClassName='dark:text-white inherit-bg'
    className='inherit-bg'
    trigger={['hover', 'click']}
  >
    {SearchBar}
  </Dropdown >

  useEffect(() => {
    if (!accountInfo) return;

    for (const id of filteredCollections) {
      console.log('ids');
      accounts.fetchBalanceForUser(id.collectionId, accountInfo?.address);
    }
  }, [filteredCollections]);

  let badgesToShow = accounts.getBalancesView(accountInfo?.address ?? '', editMode ? 'badgesCollectedWithHidden' : 'badgesCollected') ?? []

  if (filteredCollections.length > 0) {
    badgesToShow = [];
    for (const filteredCollection of filteredCollections) {
      const balanceInfo = accounts.getAccount(accountInfo?.address ?? '')?.collected.find(x => x.collectionId === filteredCollection.collectionId);
      if (balanceInfo) {
        const balancesToAdd = [];
        for (const balance of balanceInfo.balances) {
          const [, removed] = removeUintRangeFromUintRange(filteredCollection.badgeIds, balance.badgeIds);
          if (removed.length > 0) {
            balancesToAdd.push({
              ...balance,
              badgeIds: removed
            });
          }
        }

        if (balancesToAdd.length > 0) {
          badgesToShow.push({
            ...balanceInfo,
            balances: balancesToAdd
          });
        }
      }
    }
  }


  const fetchMoreCollected = async () => {
    if (!accountInfo) return;

    if (numBadgesDisplayed + 25 > numTotalBadges || groupByCollection) {
      await accounts.fetchNextForViews(accountInfo.address, editMode ? ['badgesCollectedWithHidden'] : ['badgesCollected']);
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
  }

  const fetchMoreLists = async () => {
    if (!accountInfo) return;

    await accounts.fetchNextForViews(accountInfo.address, [`${listsTab}`]);
  }

  const fetchMoreCreatedBy = async () => {
    if (!accountInfo) return;

    await accounts.fetchNextForViews(accountInfo?.address ?? '', ['createdBy']);
  }

  const fetchMoreManaging = async () => {
    if (!accountInfo) return;

    await accounts.fetchNextForViews(accountInfo?.address ?? '', ['managing', 'createdBy']);
  }
  const listsView = accounts.getAddressMappingsView(accountInfo?.address ?? '', listsTab) ?? [];


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch more collected');
    //Fetch on tab change but only if empty and has mroe
    const collectedIsEmpty = accountInfo?.views['badgesCollected']?.ids.length === 0;
    const listsIsEmpty = accountInfo?.views['addressMappings']?.ids.length === 0;
    const createdByIsEmpty = accountInfo?.views['createdBy']?.ids.length === 0;
    const managingIsEmpty = accountInfo?.views['managing']?.ids.length === 0;

    if (tab === 'collected' && collectedIsEmpty && (accountInfo?.views['badgesCollected']?.pagination?.hasMore ?? true)) {
      fetchMoreCollected();
    } else if (tab === 'lists' && hasMoreAddressMappings && listsIsEmpty) {
      fetchMoreLists();
    } else if (tab === 'createdBy' && (accountInfo?.views['createdBy']?.pagination?.hasMore ?? true) && createdByIsEmpty) {
      fetchMoreCreatedBy();
    } else if (tab === 'managing' && (accountInfo?.views['managing']?.pagination?.hasMore ?? true) && managingIsEmpty) {
      fetchMoreManaging();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'lists') {
      const createdBys = listsView.map((addressMapping) => addressMapping.createdBy);
      accounts.fetchAccounts([...new Set(createdBys)]);
    }
  }, [tab, listsView]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;

      await accounts.fetchNextForViews(addressOrUsername as string, ['latestActivity', 'latestReviews', 'badgesCollected', 'addressMappings', 'explicitlyIncludedAddressMappings', 'explicitlyExcludedAddressMappings']);
      // if (fetchedAccount.readme) {
      //   setTab('overview');
      // }
    }
    getPortfolioInfo();
  }, [addressOrUsername, showHidden]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get num total badges ');
    if (!accountInfo) return;

    //Calculate badge IDs for each collection
    const allBadgeIds: {
      collectionId: bigint
      badgeIds: UintRange<bigint>[]
    }[] = [];
    for (const balanceInfo of badgesToShow) {
      if (!balanceInfo) {
        continue;
      }

      if (accountInfo) {
        allBadgeIds.push({
          badgeIds: balanceInfo.balances.map(balance => balance.badgeIds).flat() || [],
          collectionId: balanceInfo.collectionId
        });
      }
    }

    //Calculate total number of badge IDs
    let total = 0n;
    for (const obj of allBadgeIds) {
      for (const range of obj.badgeIds) {
        const numBadgesInRange = range.end - range.start + 1n;
        total += numBadgesInRange;
      }
    }
    setNumTotalBadges(Numberify(total));
  }, [accountInfo, editMode, showHidden, filteredCollections]);

  const [reactElement, setReactElement] = useState<ReactElement | null>(null);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get readme');
    const HtmlToReactParser = HtmlToReact.Parser();
    const reactElement = HtmlToReactParser.parse(mdParser.render(accountInfo?.readme ? accountInfo?.readme : ''));
    setReactElement(reactElement);
  }, [accountInfo?.readme]);



  if (!accountInfo) {
    return <></>
  }

  const collectedHasMore = editMode ? accountInfo?.views['badgesCollectedWithHidden']?.pagination?.hasMore ?? true :
    accountInfo?.views['badgesCollected']?.pagination?.hasMore ?? true;
  const hasMoreAddressMappings = accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true;


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

        <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
        {tab === 'overview' && (<>
          <br />
          <InformationDisplayCard
            span={24}
            title="About"
          >
            <div style={{ overflow: 'auto' }} >
              <div className='custom-html-style dark:text-white' id="description">
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
              <div className='dark:text-white inherit-bg' style={{
                float: 'right',
                display: 'flex',
                alignItems: 'center',
                marginRight: 16,
                marginTop: 5,
              }}>
                Mode:

                <Select
                  className='selector dark:text-white inherit-bg'
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
                      className='dark:text-white'
                    />
                  }
                >
                  <Select.Option value="none">View as Normal User</Select.Option>
                  <Select.Option value="edit">Customize Mode</Select.Option>
                </Select>
              </div>
            )}

            {<div className='dark:text-white inherit-bg' style={{
              float: 'right',
              display: 'flex',
              alignItems: 'center',
              marginRight: 16,
              marginTop: 5,
            }}>
              Group By:

              <Select
                className='selector dark:text-white inherit-bg'
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
                    className='dark:text-white'
                  />
                }
              >
                <Select.Option value="none">None</Select.Option>
                <Select.Option value="collection">Collection</Select.Option>
              </Select>
            </div>
            }

            {!editMode && <div className='dark:text-white inherit-bg'
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
                className="selector dark:text-white inherit-bg"
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
                    className='dark:text-white'
                  />
                }
              >
                <Select.Option value="card">Card</Select.Option>
                <Select.Option value="image">Image</Select.Option>
              </Select>
            </div>}
            {tab != 'hidden' && <>
              <div className='dark:text-white inherit-bg'
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
              const collection = collections.getCollection(filteredCollection.collectionId);
              const metadata = isFullUintRanges(filteredCollection.badgeIds) ? collection?.cachedCollectionMetadata
                : getMetadataForBadgeId(filteredCollection.badgeIds[0].start, collection?.cachedBadgeMetadata ?? []);
              return <Tag
                className='dark:text-white inherit-bg flex-between'
                style={{ alignItems: 'center', marginBottom: 8 }}
                key={idx}
                closable
                closeIcon={<CloseCircleOutlined
                  className='dark:text-white styled-button flex-center'
                  style={{ border: "none", fontSize: 16, alignContent: 'center', marginLeft: 5 }}
                  size={50}
                />}
                onClose={() => {
                  setFilteredCollections(filteredCollections.filter(x => !compareObjects(x, filteredCollection)));
                }}
              >
                <div className='dark:text-white inherit-bg' style={{ alignItems: 'center', marginRight: 4, maxWidth: 280 }}>
                  <div className='flex-center' style={{ alignItems: 'center', maxWidth: 280 }}>
                    <div>
                      <BadgeAvatar
                        size={30}
                        noHover
                        collectionId={filteredCollection.collectionId}
                        metadataOverride={metadata}
                      />
                    </div>
                    <Typography.Text className="dark:text-white" style={{ fontSize: 16, fontWeight: 'bold', margin: 4, overflowWrap: 'break-word', }}>
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


          <Divider />
        </>)}

        {/* Tab Content */}
        {tab === 'collected' && (<>
          <div className='flex-center flex-wrap'>
            {filteredCollections.length == 0 && !editMode && (accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.map((collection) => collection.collectionId) ?? []).length > 0 &&
              accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.some((collection) => collection.badgeIds.length > 0)
              && <>
                <Typography.Text strong className='dark:text-white' style={{ fontSize: 20, marginRight: 4 }}>
                  <FontAwesomeIcon
                    icon={faThumbTack}
                    style={{ marginRight: 4 }}
                  />
                  {badgeTab}
                </Typography.Text>

                <MultiCollectionBadgeDisplay
                  collectionIds={accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.map((collection) => collection.collectionId) ?? []}
                  customPageBadges={accountInfo.customPages?.find(x => x.title === badgeTab)?.badges ?? []}
                  cardView={cardView}
                  groupByCollection={groupByCollection}
                  defaultPageSize={groupByCollection ? (accountInfo.customPages?.find(x => x.title === badgeTab)?.badges.map((collection) => collection.collectionId) ?? []).length : numBadgesDisplayed}
                  hidePagination={true}

                  showCustomizeButtons={editMode}
                />
                <Divider />
                {badgesToShow.length > 0 &&
                  <Typography.Text strong className='dark:text-white' style={{ fontSize: 20, marginRight: 4 }}>All</Typography.Text>}
              </>
            }

            <InfiniteScroll
              dataLength={!groupByCollection ? numBadgesDisplayed : badgesToShow.length}
              next={fetchMoreCollected}
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
                customPageBadges={filteredCollections.length > 0 ? badgesToShow.map(x => {
                  return {
                    collectionId: x.collectionId,
                    badgeIds: x.balances.map(balance => {
                      return balance.badgeIds
                    }).flat()
                  }
                }) : undefined}
                cardView={cardView}
                groupByCollection={groupByCollection}
                defaultPageSize={groupByCollection ? badgesToShow.length : numBadgesDisplayed}
                hidePagination={true}
                showCustomizeButtons={editMode}
              />
            </InfiniteScroll>

            {badgesToShow.every((collection) => collection.balances.length === 0) && !collectedHasMore && (
              <Empty
                className='dark:text-white'
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

        {tab === 'lists' && (<>
          <br />
          <div className='dark:text-white inherit-bg'
            style={{
              float: 'right',
              display: 'flex',
              alignItems: 'center',
              marginLeft: 16,
              marginRight: 16,
              marginTop: 5,
              textAlign: 'right'
            }}>
            View:

            <Select
              className="selector dark:text-white inherit-bg"
              value={listsTab}
              placeholder="Default: None"
              onChange={(e: any) => {
                setListsTab(e)
              }}
              style={{
                float: 'right',
                marginLeft: 8,

              }}
              dropdownStyle={{
                minWidth: 150
              }}
              placement='bottomRight'
              suffixIcon={
                <DownOutlined
                  className='dark:text-white'
                />
              }
            >
              <Select.Option value="addressMappings">All</Select.Option>
              <Select.Option value="explicitlyIncludedAddressMappings" >Explicitly Included</Select.Option>
              <Select.Option value="explicitlyExcludedAddressMappings">Explicitly Excluded</Select.Option>

            </Select>
          </div>
          <Divider />
          <div className='flex-center flex-wrap'>
            <InfiniteScroll
              dataLength={listsView.length}
              next={fetchMoreLists}
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
                className='dark:text-white'
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
              await accounts.fetchNextForViews(accountInfo?.address ?? '', ['latestReviews']);
            }}
            hasMore={accountInfo?.views['latestReviews']?.pagination?.hasMore ?? true}
            addressOrUsername={accountInfo?.address ?? ''}
          />
        </>
        )}


        {tab === 'activity' && (<>
          <br />
          <ActivityTab
            activity={accounts.getActivityView(accountInfo?.address ?? '', 'latestActivity') ?? []}
            fetchMore={async () => {
              await accounts.fetchNextForViews(accountInfo?.address ?? '', ['latestActivity']);
            }}
            hasMore={accountInfo?.views['latestActivity']?.pagination?.hasMore ?? true}
          />
        </>
        )}

        {tab === 'createdBy' && (<>
          <br />
          <div className='flex-center flex-wrap'>
            <InfiniteScroll
              dataLength={accountInfo?.views['createdBy']?.ids.length ?? 0}
              next={fetchMoreCreatedBy}
              hasMore={accountInfo?.views['createdBy']?.pagination?.hasMore ?? true}
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
                  collectionIds={accountInfo?.views['createdBy']?.ids.map(x => BigInt(x)) ?? []}
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
                className='dark:text-white'
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
              next={fetchMoreManaging}
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
                className='dark:text-white'
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

        {tab === 'hidden' && (<>
          {!chain.loggedIn ? <BlockinDisplay /> :
            <div className='flex-center flex-wrap'>
              <InfiniteScroll
                dataLength={!groupByCollection ? hiddenBadgesDisplayed : accountInfo.hiddenBadges?.length ?? 0}
                next={async () => {
                  setHiddenBadgesDisplayed(hiddenBadgesDisplayed + 25);
                }}
                hasMore={(!groupByCollection && hiddenBadgesDisplayed < (getTotalNumberOfBadgeIds(accountInfo?.hiddenBadges?.map(x => x.badgeIds).flat() ?? []) ?? 0))}
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
                {(getTotalNumberOfBadgeIds(accountInfo?.hiddenBadges?.map(x => x.badgeIds).flat() ?? []) ?? 0) > 0 &&
                  <Typography.Text strong className='dark:text-white' style={{ fontSize: 20, marginRight: 4 }}>Hidden</Typography.Text>}
                <MultiCollectionBadgeDisplay
                  collectionIds={accountInfo.hiddenBadges?.map((collection) => collection.collectionId) ?? []}
                  addressOrUsernameToShowBalance={accountInfo.address}
                  customPageBadges={accountInfo.hiddenBadges ?? []}
                  cardView={cardView}
                  groupByCollection={groupByCollection}
                  defaultPageSize={groupByCollection ? 1 : hiddenBadgesDisplayed}
                  hidePagination={true}
                  showCustomizeButtons={editMode}
                />
              </InfiniteScroll>

              {((accountInfo.hiddenBadges ?? [])?.length == 0 ||
                (accountInfo.hiddenBadges ?? []).every((collection) => collection.badgeIds.length === 0))
                && (
                  <Empty
                    className='dark:text-white'
                    description={
                      <span>
                        No badges found.
                      </span>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}


            </div>
          }
        </>)}
      </div>
      <DevMode obj={accountInfo} />
      <Divider />
    </Content >
  );
}

export default PortfolioPage;
