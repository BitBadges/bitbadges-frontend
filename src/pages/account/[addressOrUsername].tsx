import { DownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Card, Divider, Empty, Layout, Select, Spin, Typography } from 'antd';
import { UintRange } from 'bitbadgesjs-proto';
import { AccountViewKey, Numberify, convertToCosmosAddress } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { BadgeAvatar } from '../../components/badges/BadgeAvatar';
import { MultiCollectionBadgeDisplay } from "../../components/badges/MultiCollectionBadgeDisplay";
import { AccountButtonDisplay } from '../../components/button-displays/AccountButtonDisplay';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { DevMode } from '../../components/common/DevMode';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { AddressListCard } from '../../components/badges/AddressListCard';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;

function PortfolioPage() {
  const router = useRouter();
  const accounts = useAccountsContext();



  const { addressOrUsername } = router.query;
  const accountInfo = typeof addressOrUsername === 'string' ? accounts.accounts[`${convertToCosmosAddress(addressOrUsername as string)}`] : undefined;

  const [tab, setTab] = useState(
    accountInfo?.readme ? 'overview' :
      'collected');
  const [cardView, setCardView] = useState(true);
  const [groupByCollection, setGroupByCollection] = useState(false);

  const [numBadgesDisplayed, setNumBadgesDisplayed] = useState<number>(25);
  const [numTotalBadges, setNumTotalBadges] = useState<number>(25);

  const [listsTab, setListsTab] = useState<AccountViewKey>('addressMappings');
  // const [showHidden, setShowHidden] = useState(false);
  const showHidden = false;

  // const isSameAccount = chain.cosmosAddress === accountInfo?.cosmosAddress

  const tabInfo = [];
  if (accountInfo?.readme) {
    tabInfo.push({ key: 'overview', content: 'Overview', disabled: false });
  }

  tabInfo.push(
    { key: 'collected', content: 'Badges', disabled: false },
    { key: 'lists', content: 'Lists' },
    // { key: 'managing', content: 'Managing', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'reputation', content: 'Reviews' }
  )



  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;

      const fetchedAccount = await accounts.fetchNextForViews(addressOrUsername as string, ['latestActivity', 'latestReviews', 'badgesCollected', 'addressMappings', 'explicitlyIncludedAddressMappings', 'explicitlyExcludedAddressMappings']);
      if (fetchedAccount.readme) {
        setTab('overview');
      }
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
    for (const balanceInfo of accountInfo.collected) {
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
  }, [accountInfo]);

  const [reactElement, setReactElement] = useState<ReactElement | null>(null);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get readme');
    const HtmlToReactParser = HtmlToReact.Parser();
    const reactElement = HtmlToReactParser.parse(mdParser.render(accountInfo?.readme ? accountInfo?.readme : ''));
    setReactElement(reactElement);
  }, [accountInfo?.readme]);


  const listsView = accounts.getAddressMappingsView(accountInfo?.cosmosAddress ?? '', listsTab) ?? [];
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: list view created by');

    const createdBys = listsView.map((addressMapping) => addressMapping.createdBy);
    accounts.fetchAccounts([...new Set(createdBys)]);
  }, [listsView]);

  if (!accountInfo) {
    return <></>
  }

  const collectedHasMore = accountInfo?.views['badgesCollected']?.pagination?.hasMore ?? true;
  const hasMoreAddressMappings = accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true;





  return (
    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
          textAlign: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          className='primary-blue-bg'
          style={{
            marginLeft: '7vw',
            marginRight: '7vw',
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
                <div className='custom-html-style primary-text' id="description">
                  {/* <Markdown> */}
                  {reactElement}
                  {/* </Markdown> */}
                </div>
              </div>
            </InformationDisplayCard>
          </>)}
          {tab === 'collected' && (<>
            <br />

            <div className='primary-text primary-blue-bg' style={{
              float: 'right',
              display: 'flex',
              alignItems: 'center',
              marginRight: 16,
              marginTop: 5,
            }}>
              Group By:

              <Select
                className='selector primary-text primary-blue-bg'
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

            <div className='primary-text primary-blue-bg'
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
                className="selector primary-text primary-blue-bg"
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
            </div>

            <Divider />
          </>)}

          {/* Tab Content */}
          {tab === 'collected' && (<>
            <div className='flex-center flex-wrap'>
              <InfiniteScroll
                dataLength={!groupByCollection ? numBadgesDisplayed : accountInfo.collected.length}
                next={async () => {
                  if (!accountInfo) return;

                  if (numBadgesDisplayed + 25 > numTotalBadges || groupByCollection) {
                    await accounts.fetchNextForViews(accountInfo.cosmosAddress, ['badgesCollected']);
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
                  collectionIds={accountInfo.collected.map((collection) => collection.collectionId)}
                  addressOrUsernameToShowBalance={accountInfo.address}
                  cardView={cardView}
                  groupByCollection={groupByCollection}
                  pageSize={groupByCollection ? accountInfo.collected.length : numBadgesDisplayed}
                  hidePagination={true}
                // showCustomizeButtons={isSameAccount}
                />
              </InfiniteScroll>

              {accountInfo?.collected.every((collection) => collection.balances.length === 0) && !collectedHasMore && (
                <Empty
                  className='primary-text'
                  description={
                    <span>
                      This account has not collected any badges yet.
                    </span>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </>)}

          {tab === 'lists' && (<>
            <br />
            <div className='primary-text primary-blue-bg'
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
                className="selector primary-text primary-blue-bg"
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
                    className='primary-text'
                  />
                }
              >
                <Select.Option value="addressMappings">All</Select.Option>
                <Select.Option value="explicitlyIncludedAddressMappings" >Explicitly Included</Select.Option>
                <Select.Option value="explicitlyExcludedAddressMappings">Explicitly Excluded</Select.Option>

              </Select>
            </div>
            <Divider />
            <div className='primary-text' style={{ fontSize: 14, textAlign: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Soft included / excluded means that the address is in the list, but the address was not explicitly added to the list.
              <br />
              <br />
              For example, abc.eth would be soft included in the following list: all addresses except xyz.eth.
            </div>
            <br />
            <div className='flex-center flex-wrap'>
              <InfiniteScroll
                dataLength={listsView.length}
                next={async () => {
                  if (!accountInfo) return;

                  await accounts.fetchNextForViews(accountInfo.cosmosAddress, [`${listsTab}`]);
                }}
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
                await accounts.fetchNextForViews(accountInfo?.cosmosAddress ?? '', ['latestReviews']);
              }}
              hasMore={accountInfo?.views['latestReviews']?.pagination?.hasMore ?? true}
              addressOrUsername={accountInfo?.address ?? ''}
            />
          </>
          )}


          {tab === 'activity' && (<>
            <br />
            <ActivityTab
              activity={accounts.getActivityView(accountInfo?.cosmosAddress ?? '', 'latestActivity') ?? []}
              fetchMore={async () => {
                await accounts.fetchNextForViews(accountInfo?.cosmosAddress ?? '', ['latestActivity']);
              }}
              hasMore={accountInfo?.views['latestActivity']?.pagination?.hasMore ?? true}
            />
          </>
          )}
        </div>
        <DevMode obj={accountInfo} />
        <Divider />
      </Content >
    </Layout >
  );
}

export default PortfolioPage;
