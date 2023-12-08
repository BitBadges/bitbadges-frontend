import { CloseCircleOutlined, DeleteOutlined, DownOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Col, Divider, Dropdown, Empty, Input, Layout, Select, Spin, Tag, Typography, notification } from 'antd';
import { UintRange, deepCopy } from 'bitbadgesjs-proto';
import { AccountViewKey, AddressMappingWithMetadata, Numberify, getMetadataForBadgeId, isFullUintRanges, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';


import { getAddressMappings } from '../../bitbadges-api/api';
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
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { FollowProtocolDisplay } from '../../components/display/FollowProtocol';

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
  const [newPageDescription, setNewPageDescription] = useState('');
  const [warned, setWarned] = useState(false);

  useEffect(() => {
    // if (tab === 'managing' || tab === 'createdBy') {
    //   setEditMode(false);
    // }
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
  const [listsTab, setListsTab] = useState<string>('addressMappings');
  const [searchValue, setSearchValue] = useState<string>('');

  useEffect(() => {
    if (listsTab !== '') {
      setAddPageIsVisible(false);
    }
  }, [listsTab]);

  const tabInfo = [];
  if (accountInfo?.readme) {
    tabInfo.push({ key: 'overview', content: 'Overview', disabled: false });
  }

  tabInfo.push(
    { key: 'collected', content: 'Badges', disabled: false },
    { key: 'lists', content: 'Lists' },
    { key: 'protocols', content: 'Protocols' },
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

    let allBadgeIds: {
      collectionId: bigint
      badgeIds: UintRange<bigint>[]
    }[] = [];
    if (badgeTab === 'Hidden') {
      allBadgeIds.push(...deepCopy(accountInfo?.hiddenBadges ?? []));
    } else if (badgeTab === 'All' || badgeTab === 'Managing' || badgeTab === 'Created') {
      if (badgeTab === 'All') {
        for (const balanceInfo of badgesToShow) {
          if (!balanceInfo) {
            continue;
          }


          allBadgeIds.push(deepCopy({
            badgeIds: balanceInfo.balances.map(balance => balance.badgeIds).flat() || [],
            collectionId: balanceInfo.collectionId
          }));
        }
      }
    } else {
      allBadgeIds.push(...deepCopy(accountInfo?.customPages?.find(x => x.title === badgeTab)?.badges ?? []))
    }

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

    console.log(allBadgeIds);
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

  const isPresetList = listsTab === 'addressMappings' || listsTab === 'explicitlyIncludedAddressMappings' || listsTab === 'explicitlyExcludedAddressMappings' || listsTab === 'privateLists' || listsTab === 'createdLists';

  const [customView, setCustomView] = useState<AddressMappingWithMetadata<bigint>[]>([]);

  useEffect(() => {
    if (isPresetList) return;

    async function getCustomView() {
      const idsToFetch = [];
      if (listsTab === 'Hidden') {
        idsToFetch.push(...accountInfo?.hiddenLists ?? []);
      } else {
        idsToFetch.push(...accountInfo?.customListPages?.find(x => x.title === listsTab)?.mappingIds ?? []);
      }

      const res = await getAddressMappings({ mappingIds: idsToFetch });
      setCustomView(res.addressMappings);
    }

    getCustomView();
  }, [listsTab, accountInfo?.customListPages, isPresetList, accountInfo?.hiddenLists]);

  const listsView = isPresetList ? getAccountAddressMappingsView(accountInfo, listsTab) : customView
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
    if (tab === 'collected') {
      if (badgeTab === 'All' && collectedIsEmpty && (accountInfo?.views['badgesCollected']?.pagination?.hasMore ?? true)) {
        fetchMoreCollected(accountInfo?.address ?? '');
      } else if (badgeTab === 'Managing' && (accountInfo?.views['managing']?.pagination?.hasMore ?? true) && managingIsEmpty) {
        fetchMoreManaging(accountInfo?.address ?? '', 'managing');
      } else if (badgeTab === 'Created' && (accountInfo?.views['createdBy']?.pagination?.hasMore ?? true) && createdByIsEmpty) {
        fetchMoreCreatedBy(accountInfo?.address ?? '', 'createdBy');
      }
    } else if (tab === 'lists' && hasMoreAddressMappings && listsIsEmpty) {
      if (isPresetList) {
        if (listsTab === 'privateLists' && !chain.loggedIn) return;
        fetchMoreLists(accountInfo?.address ?? '', listsTab);
      }
    }
  }, [tab, accountInfo, fetchMoreLists, fetchMoreCreatedBy, fetchMoreManaging, fetchMoreCollected, listsTab, isPresetList, badgeTab, chain.loggedIn]);

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

  const removeFromArray = (arr: BadgeIdObj[], badgeIdObjsToRemove: BadgeIdObj[]) => {
    for (const badgeIdObj of badgeIdObjsToRemove) {
      const badgeIdsToRemove = badgeIdObj.badgeIds;


      const existingIdx = arr.findIndex(x => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        const [remaining,] = removeUintRangeFromUintRange(badgeIdsToRemove, arr[existingIdx].badgeIds);
        arr[existingIdx].badgeIds = remaining;
      }
    }

    return arr.filter(x => x.badgeIds.length > 0);
  }

  const [selectedBadge, setSelectedBadge] = useState<BadgeIdObj | null>(null);

  const CustomizeSearchBar = <Input
    defaultValue=""
    placeholder={"Add or remove by searching a collection or badge"}

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
            if (isCollection) {
              setSelectedBadge({
                collectionId: BigInt(searchValue),
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }]
              });
            } else if (isBadge) {
              const collectionId = BigInt(searchValue.split('/')[0]);
              const badgeId = BigInt(searchValue.split('/')[1]);

              setSelectedBadge({
                collectionId,
                badgeIds: [{ start: badgeId, end: badgeId }]
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

  const [customizeSearchListValue, setCustomizeSearchListValue] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const selectedListMapping = accountInfo?.addressMappings?.find(x => x.mappingId === selectedList);

  const CustomizeListSearchBar = <Input
    defaultValue=""
    placeholder={"Add or remove by searching a list"}

    value={customizeSearchListValue}
    onChange={async (e) => {
      setCustomizeSearchListValue(e.target.value);
    }}
    className='form-input'
    style={{}}
  />;

  const CustomizeSearchListDropdown = <Dropdown
    open={customizeSearchListValue !== ''}
    placement="bottom"
    overlay={
      <SearchDropdown
        onlyLists
        onSearch={async (searchValue: any, isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
          if (!isAccount && !isCollection && !isBadge && typeof searchValue === 'string') {
            setSelectedList(searchValue);
            setCustomizeSearchListValue('');
          }
        }}
        searchValue={customizeSearchListValue}
      />
    }
    overlayClassName='primary-text inherit-bg'
    className='inherit-bg'
    trigger={['hover', 'click']}
  >
    {CustomizeListSearchBar}
  </Dropdown >

  if (!accountInfo) {
    return <></>
  }

  const BadgeIdObjTag = ({ badgeIdObj, onClose, }: { badgeIdObj: BadgeIdObj, onClose?: () => void }) => {
    const collection = getCollection(badgeIdObj.collectionId);
    const metadata = isFullUintRanges(badgeIdObj.badgeIds) ? collection?.cachedCollectionMetadata
      : getMetadataForBadgeId(badgeIdObj.badgeIds[0].start, collection?.cachedBadgeMetadata ?? []);
    return <Tag
      className='primary-text inherit-bg flex-between'
      style={{ alignItems: 'center', marginBottom: 8 }}
      closable
      closeIcon={onClose ? <CloseCircleOutlined
        className='primary-text styled-button flex-center'
        style={{ border: "none", fontSize: 16, alignContent: 'center', marginLeft: 5 }}
        size={50}
      /> : <></>}
      onClose={onClose}
    >
      <div className='primary-text inherit-bg' style={{ alignItems: 'center', marginRight: 4, maxWidth: 280 }}>
        <div className='flex-center' style={{ alignItems: 'center', maxWidth: 280 }}>
          <div>
            <BadgeAvatar
              size={30}
              noHover
              collectionId={badgeIdObj.collectionId}
              metadataOverride={metadata}
            />
          </div>
          <Typography.Text className="primary-text" style={{ fontSize: 16, fontWeight: 'bold', margin: 4, overflowWrap: 'break-word', }}>
            <div style={{ marginBottom: 4 }}>
              {metadata?.name}
            </div>
            <div style={{ fontSize: 12 }}>
              Collection ID: {badgeIdObj.collectionId.toString()}
              <br />

              {isFullUintRanges(badgeIdObj.badgeIds) ? 'All' : `Badge IDs: ${badgeIdObj.badgeIds.map(x =>
                x.start === x.end ? `${x.start}` :
                  `${x.start}-${x.end}`).join(', ')}`}
            </div>
          </Typography.Text>
        </div>
      </div>
      <br />


    </Tag>
  }

  const CustomizeSelect = <>{
    chain.address === accountInfo.address && chain.loggedIn && (
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
    )
  }</>


  const currView = badgeTab === 'Managing' ? accountInfo.views['managing'] : badgeTab === 'Created' ? accountInfo.views['createdBy'] : accountInfo.views['badgesCollected'];


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
            <div style={{ overflow: 'auto' }}  >
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
            {CustomizeSelect}

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
              return <BadgeIdObjTag key={idx} badgeIdObj={filteredCollection} onClose={() => {
                setFilteredCollections(filteredCollections.filter(x => !compareObjects(x, filteredCollection)));
              }} />
            })}
          </div>


        </>)}

        {tab === 'protocols' && (<>
          <FollowProtocolDisplay addressOrUsername={accountInfo.address} />
        </>)}

        {/* Tab Content */}
        {tab === 'collected' && (<>
          <div className=''>
            <div className='flex-center flex-wrap'>
              {
                <Tabs
                  tabInfo={
                    [
                      {
                        key: 'All', content: 'All', disabled: false
                      },

                      {
                        key: 'Created', content: 'Created', disabled: false
                      },
                      {
                        key: 'Managing', content: 'Managing', disabled: false
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
            {badgeTab !== '' && accountInfo.customPages?.find(x => x.title === badgeTab)?.description && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
              {accountInfo.customPages?.find(x => x.title === badgeTab)?.description}
            </div>}

            <br />

            {badgeTab != 'All' && badgeTab != '' && editMode && <>
              {/* <div className='flex-center'>
                <IconButton
                  src={<SearchOutlined />}
                  text='Add via Search'
                />
                <IconButton
                  src={<SearchOutlined />}
                  text='Remove via Search'
                />
              </div> */}
              <div className='flex-center'>


                <InformationDisplayCard title='' md={12} xs={24} style={{ marginBottom: 8 }} noBorder={!selectedBadge} inheritBg={!selectedBadge}>
                  <div className='flex'>
                    {CustomizeSearchDropdown}

                  </div>

                  {selectedBadge && <>
                    <br />
                    <div className='flex-center'>
                      <BadgeIdObjTag badgeIdObj={selectedBadge} onClose={() => { setSelectedBadge(null) }} />
                    </div>
                    <br />
                  </>}

                  {selectedBadge &&
                    <div className='flex-center flex-wrap'>
                      <button className='landing-button' onClick={async () => {
                        if (!selectedBadge) return;

                        let currCustomPageBadges = badgeTab == 'Hidden' ? deepCopy(accountInfo?.hiddenBadges ?? []) :
                          deepCopy(accountInfo?.customPages?.find(x => x.title === badgeTab)?.badges ?? []);
                        currCustomPageBadges = addToArray(currCustomPageBadges, [selectedBadge]);

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

                        setSelectedBadge(null);
                      }}>
                        Add
                      </button>

                      <button className='landing-button' onClick={async () => {
                        if (!selectedBadge) return;

                        let currCustomPageBadges = badgeTab == 'Hidden' ? deepCopy(accountInfo?.hiddenBadges ?? []) :
                          deepCopy(accountInfo?.customPages?.find(x => x.title === badgeTab)?.badges ?? []);
                        currCustomPageBadges = removeFromArray(currCustomPageBadges, [selectedBadge]);

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

                        setSelectedBadge(null);
                      }}>
                        Remove
                      </button>
                    </div>}
                </InformationDisplayCard>

              </div></>}

            {addPageIsVisible && <div className='flex-center '>
              <Col md={12} xs={24} style={{ marginBottom: 8 }}>
                <b className='primary-text' style={{ textAlign: 'center' }}>Name</b><br />
                <Input

                  defaultValue=""
                  placeholder="Page Name"
                  className='form-input'
                  style={{
                    maxWidth: 300,
                    marginRight: 8
                  }}
                  onChange={(e) => {
                    if (e) setNewPageTitle(e.target.value);
                  }}
                />
                <br />
                <br />
                <b className='primary-text' style={{ textAlign: 'center' }}>Description</b><br />
                <Input.TextArea
                  autoSize
                  defaultValue=""
                  placeholder="Page Description"
                  className='form-input'
                  style={{
                    maxWidth: 300,
                    marginRight: 8
                  }}
                  onChange={(e) => {
                    if (e) setNewPageDescription(e.target.value);
                  }}
                />
                <br />
                <br />
                <div className='flex-center'>
                  <button className='landing-button' onClick={async () => {
                    const newCustomPages = deepCopy(accountInfo.customPages ?? []);
                    newCustomPages.push({
                      title: newPageTitle,
                      description: newPageDescription,
                      badges: []
                    });

                    await updateProfileInfo(chain.address, {
                      customPages: newCustomPages
                    });

                    setAddPageIsVisible(false);
                    setBadgeTab(newPageTitle);
                    setNewPageDescription('');
                    setNewPageTitle('');
                  }}>
                    Add Page
                  </button>
                </div>
              </Col>
            </div>}

            {(badgeTab === 'Managing' || badgeTab === 'Created') && (<>
              <InfiniteScroll
                dataLength={currView?.ids.length ?? 0}
                next={async () => {
                  if (badgeTab === 'Managing') {
                    await fetchMoreManaging(accountInfo?.address ?? '', 'managing');
                  } else {
                    await fetchMoreCreatedBy(accountInfo?.address ?? '', 'createdBy');
                  }
                }}
                hasMore={currView?.pagination?.hasMore ?? true}
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
                    collectionIds={currView?.ids.map(x => BigInt(x)) ?? []}
                    cardView={cardView}
                    groupByCollection={true}
                    defaultPageSize={cardView ? 1 : 10}
                    hidePagination={true}
                    hideAddress
                    showCustomizeButtons={editMode}
                  />
                </div>
              </InfiniteScroll>

              {currView?.ids.length == 0 && !currView?.pagination?.hasMore && (
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

            </>)}

            {badgeTab !== '' && badgeTab !== 'Managing' && badgeTab !== 'Created' && <>
              <InfiniteScroll
                dataLength={!groupByCollection ? numBadgesDisplayed : badgesToShow.length}
                next={async () => {
                  if (badgeTab === 'All') {
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
                  } else if (badgeTab === 'Created') {
                    await fetchMoreCreatedBy(accountInfo?.address ?? '', 'createdBy');
                  } else if (badgeTab === 'Managing') {
                    await fetchMoreManaging(accountInfo?.address ?? '', 'managing');
                  }
                }}
                hasMore={badgeTab === 'All' ?
                  (collectedHasMore || (!groupByCollection && numBadgesDisplayed < numTotalBadges)) :
                  (badgeTab === 'Created' ? (createdView?.pagination?.hasMore ?? true) : (badgeTab === 'Managing' ? (accountInfo?.views['managing']?.pagination?.hasMore ?? true) : false))}
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
          <div className='flex-wrap full-width flex' style={{ flexDirection: 'row-reverse' }}>
            {CustomizeSelect}
          </div>


          <div className='flex-center'>
            <Tabs
              tabInfo={


                [
                  { key: 'addressMappings', content: 'All', disabled: false },
                  { key: 'explicitlyIncludedAddressMappings', content: 'Included', disabled: false },
                  { key: 'explicitlyExcludedAddressMappings', content: 'Excluded', disabled: false },
                  { key: 'createdLists', content: 'Created', disabled: false },
                  chain.cosmosAddress && chain.cosmosAddress === accountInfo.cosmosAddress

                    ? { key: 'privateLists', content: 'Private', disabled: false } : undefined,
                  ...(editMode ? [{
                    key: 'Hidden', content: 'Hidden', disabled: false
                  }] : []),
                  ...accountInfo.customListPages?.map((customPage) => {
                    return {
                      key: customPage.title, content:
                        <div className='flex-center' style={{ marginLeft: editMode ? 8 : undefined }}>
                          {customPage.title}
                          {editMode && listsTab !== 'All' && listsTab !== 'Hidden' && listsTab !== '' && listsTab === customPage.title && <>


                            <IconButton
                              text=''
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this page?')) {
                                  return
                                }

                                const newCustomPages = deepCopy(accountInfo.customListPages ?? []);
                                newCustomPages.splice(newCustomPages.findIndex(x => x.title === listsTab), 1);

                                await updateProfileInfo(chain.address, {
                                  customListPages: newCustomPages
                                });

                                setListsTab('All');
                              }}
                              src={<DeleteOutlined />}
                            />
                          </>}
                        </div>, disabled: false
                    }
                  }) ?? []

                ]
              }
              tab={listsTab} setTab={(e) => {
                setListsTab(e as AccountViewKey);
              }}
              type='underline'
            />

            {editMode && <IconButton src={<PlusOutlined />}
              text=''
              tooltipMessage='Add a new page to your portfolio.'
              onClick={() => {
                setAddPageIsVisible(true);
                setListsTab(''); //Reset tab
              }} />}
          </div>
          {listsTab === 'Hidden' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            <InfoCircleOutlined /> Hidden lists will be automatically filtered out from standard views and not shown by default.
          </div>}
          {listsTab === 'All' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            <InfoCircleOutlined /> These results only include whitelists where the address is included and blacklists where the address is excluded.
          </div>}
          {listsTab === 'explicitlyIncludedAddressMappings' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            <InfoCircleOutlined /> These results
            only include whitelists where the address is included.
          </div>}
          {listsTab === 'explicitlyExcludedAddressMappings' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            <InfoCircleOutlined /> These results
            only include blacklists where the address is excluded.
          </div>}
          {listsTab === 'createdLists' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            <InfoCircleOutlined /> These results include lists created by this user.
          </div>}
          {listsTab === 'privateLists' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            <InfoCircleOutlined /> These results include private lists created by you and are only visible to you.
          </div>}
          {listsTab !== '' && <div className='secondary-text' style={{ marginBottom: 16, marginTop: 4 }}>
            {accountInfo.customListPages?.find(x => x.title === badgeTab)?.description}
          </div>}

          {!isPresetList && listsTab != '' && editMode && <>

            <div className='flex-center'>
              <InformationDisplayCard title='' md={12} xs={24} style={{ marginBottom: 8 }} noBorder={!selectedList} inheritBg={!selectedList}>
                <div className='flex'>
                  {CustomizeSearchListDropdown}
                </div>

                {selectedList && selectedListMapping && <>
                  <br />
                  <div className='flex-center'>
                    <AddressListCard
                      addressMapping={selectedListMapping}
                      addressOrUsername={accountInfo.address}
                    />
                  </div>
                  <br />
                </>}

                {selectedList &&
                  <div className='flex-center flex-wrap'>
                    <button className='landing-button' onClick={async () => {
                      if (!selectedList) return;

                      let currCustomPageLists = listsTab == 'Hidden' ? deepCopy(accountInfo?.hiddenLists ?? []) :
                        deepCopy(accountInfo?.customListPages?.find(x => x.title === listsTab)?.mappingIds ?? []);

                      currCustomPageLists = currCustomPageLists.concat([selectedList]);

                      if (listsTab == 'Hidden') {
                        await updateProfileInfo(chain.address, {
                          hiddenLists: currCustomPageLists
                        });
                      } else {
                        const currCustomPage = accountInfo?.customListPages?.find(x => x.title === listsTab);
                        if (!currCustomPage) return;

                        await updateProfileInfo(chain.address, {
                          customListPages: accountInfo?.customListPages?.map(x => x.title === listsTab ? { ...currCustomPage, mappingIds: currCustomPageLists } : x)
                        });
                      }

                      setSelectedList('');
                    }}>
                      Add
                    </button>

                    <button className='landing-button' onClick={async () => {
                      if (!selectedList) return;

                      let currCustomPageLists = listsTab == 'Hidden' ? deepCopy(accountInfo?.hiddenLists ?? []) :
                        deepCopy(accountInfo?.customListPages?.find(x => x.title === listsTab)?.mappingIds ?? []);
                      currCustomPageLists = currCustomPageLists.filter(x => x !== selectedList);

                      if (listsTab == 'Hidden') {
                        await updateProfileInfo(chain.address, {
                          hiddenLists: currCustomPageLists
                        });
                      } else {
                        const currCustomPage = accountInfo?.customListPages?.find(x => x.title === listsTab);
                        if (!currCustomPage) return;

                        await updateProfileInfo(chain.address, {
                          customListPages: accountInfo?.customListPages?.map(x => x.title === listsTab ? { ...currCustomPage, mappingIds: currCustomPageLists } : x)
                        });
                      }

                      setSelectedList('');
                    }}>
                      Remove
                    </button>
                  </div>}
              </InformationDisplayCard>
            </div></>}

          {addPageIsVisible && <div className='flex-center '>
            <Col md={12} xs={24} style={{ marginBottom: 8 }}>
              <b className='primary-text' style={{ textAlign: 'center' }}>Name</b><br />
              <Input

                defaultValue=""
                placeholder="Page Name"
                className='form-input'
                style={{
                  maxWidth: 300,
                  marginRight: 8
                }}
                onChange={(e) => {
                  if (e) setNewPageTitle(e.target.value);
                }}
              />
              <br />
              <br />
              <b className='primary-text' style={{ textAlign: 'center' }}>Description</b><br />
              <Input.TextArea
                autoSize
                defaultValue=""
                placeholder="Page Description"
                className='form-input'
                style={{
                  maxWidth: 300,
                  marginRight: 8
                }}
                onChange={(e) => {
                  if (e) setNewPageDescription(e.target.value);
                }}
              />
              <br />
              <br />
              <div className='flex-center'>
                <button className='landing-button' onClick={async () => {
                  const newCustomPages = deepCopy(accountInfo.customListPages ?? []);
                  newCustomPages.push({
                    title: newPageTitle,
                    description: newPageDescription,
                    mappingIds: []
                  });

                  await updateProfileInfo(chain.address, {
                    customListPages: newCustomPages
                  });

                  setAddPageIsVisible(false);
                  setListsTab(newPageTitle);
                  setNewPageDescription('');
                  setNewPageTitle('');
                }}>
                  Add Page
                </button>
              </div>
            </Col>
          </div>}
          {listsTab !== '' && <>
            {listsTab === 'privateLists' && !chain.loggedIn ? <BlockinDisplay /> : <>

              <div className='flex-center flex-wrap'>
                <InfiniteScroll
                  dataLength={listsView.length}
                  next={async () => {
                    if (isPresetList) fetchMoreLists(accountInfo?.address ?? '', listsTab)
                  }}
                  hasMore={isPresetList && hasMoreAddressMappings}
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
                        hideInclusionDisplay={listsTab === 'privateLists' || listsTab === 'createdLists'}
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
            </>}
          </>}
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



      </div>
      <DevMode obj={accountInfo} />
      <Divider />
    </Content >
  );
}

export default PortfolioPage;
