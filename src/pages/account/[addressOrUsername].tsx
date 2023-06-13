import { DownOutlined } from '@ant-design/icons';
import { Divider, Empty, Layout, Select, Spin } from 'antd';
import { IdRange } from 'bitbadgesjs-proto';
import { isAddressValid, Numberify } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { ActivityTab } from '../../components/activity/ActivityDisplay';
import { MultiCollectionBadgeDisplay } from '../../components/badges/MultiCollectionBadgeDisplay';
import { AccountButtonDisplay } from '../../components/button-displays/AccountButtonDisplay';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { DevMode } from '../../components/common/DevMode';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { Tabs } from '../../components/navigation/Tabs';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;

function PortfolioPage() {
  const router = useRouter();
  const accounts = useAccountsContext();
  const accountsRef = useRef(accounts);
  const { addressOrUsername } = router.query;

  const accountInfo = typeof addressOrUsername === 'string' ? accounts.getAccount(JSON.stringify(addressOrUsername)) : undefined;

  const [tab, setTab] = useState('collected');
  const [cardView, setCardView] = useState(true);
  const [groupByCollection, setGroupByCollection] = useState(false);

  const [numBadgesDisplayed, setNumBadgesDisplayed] = useState<number>(25);
  const [numTotalBadges, setNumTotalBadges] = useState<number>(25);

  const tabInfo = [];
  if (accountInfo?.readme) {
    tabInfo.push({ key: 'overview', content: 'Overview', disabled: false });
  }

  tabInfo.push(
    { key: 'collected', content: 'Collected', disabled: false },
    // { key: 'managing', content: 'Managing', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'reputation', content: 'Reviews' }
  )

  useEffect(() => {
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;

      const fetchedAccounts = await accountsRef.current.fetchAccountsWithOptions([{
        address: isAddressValid(addressOrUsername as string) ? addressOrUsername as string : undefined,
        username: isAddressValid(addressOrUsername as string) ? undefined : addressOrUsername as string,
        viewsToFetch: [{
          viewKey: 'latestActivity',
          bookmark: ''
        }, {
          viewKey: 'latestReviews',
          bookmark: ''
        }, {
          viewKey: 'badgesCollected',
          bookmark: ''
        }]
      }]);
      const fetchedAccount = fetchedAccounts[0];

      if (fetchedAccount.readme) {
        setTab('overview');
      }
    }
    getPortfolioInfo();
  }, [addressOrUsername]);



  useEffect(() => {
    if (!accountInfo) return;

    //Calculate badge IDs for each collection
    const allBadgeIds: {
      collectionId: bigint
      badgeIds: IdRange<bigint>[]
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
    const HtmlToReactParser = HtmlToReact.Parser();
    const reactElement = HtmlToReactParser.parse(mdParser.render(accountInfo?.readme ? accountInfo?.readme : ''));
    setReactElement(reactElement);
  }, [accountInfo?.readme]);

  if (!accountInfo) {
    return <></>
  }

  const collectedHasMore = accountInfo?.views['badgesCollected']?.pagination?.hasMore ?? false;

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
          {accountInfo && <AccountButtonDisplay addressOrUsername={accountInfo.cosmosAddress} />}

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
                hasMore={collectedHasMore || numBadgesDisplayed < numTotalBadges}
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
                  addressOrUsernameToShowBalance={accountInfo.cosmosAddress}
                  cardView={cardView}
                  groupByCollection={groupByCollection}
                  pageSize={groupByCollection ? accountInfo.collected.length : numBadgesDisplayed}
                  hidePagination={true}
                />
              </InfiniteScroll>

              {accountInfo?.collected.length === 0 && !collectedHasMore && (
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
          {tab === 'reputation' && (<>
            <ReputationTab
              reviews={accountInfo?.reviews ?? []}
              fetchMore={async () => {
                await accounts.fetchNextForViews(accountInfo?.cosmosAddress ?? '', ['latestReviews']);
              }}
              hasMore={accountInfo?.views['latestReviews']?.pagination?.hasMore ?? false}
            />
          </>
          )}


          {tab === 'activity' && (<>
            <br />
            <ActivityTab
              activity={accountInfo?.activity ?? []}
              fetchMore={async () => {
                await accounts.fetchNextForViews(accountInfo?.cosmosAddress ?? '', ['latestActivity']);
              }}
              hasMore={accountInfo?.views['latestActivity']?.pagination?.hasMore ?? false}
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
