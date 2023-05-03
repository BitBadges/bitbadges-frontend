import { DownOutlined } from '@ant-design/icons';
import { Divider, Empty, Layout, Select, Spin } from 'antd';
import { BitBadgeCollection, GetPortfolioResponse, IdRange, isAddressValid } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getPortfolio, updatePortfolioCollected, updateUserActivity, updateUserReviews } from '../../bitbadges-api/api';
import { ActivityTab } from '../../components/activity/ActivityDisplay';
import { MultiCollectionBadgeDisplay } from '../../components/badges/MultiCollectionBadgeDisplay';
import { AccountButtonDisplay } from '../../components/button-displays/AccountButtonDisplay';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { Tabs } from '../../components/navigation/Tabs';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;



function PortfolioPage() {
  const router = useRouter();
  const collections = useCollectionsContext();
  const accounts = useAccountsContext();
  const { addressOrAccountNum } = router.query;

  const [cosmosAddress, setCosmosAddress] = useState<string>('');
  // const [acctNumber, setAcctNumber] = useState<number>(-1);
  const [readme, setReadme] = useState<string>('');
  const [portfolioInfo, setPortfolioInfo] = useState<GetPortfolioResponse>();
  const [tab, setTab] = useState('collected');
  const [cardView, setCardView] = useState(true);
  const [groupByCollection, setGroupByCollection] = useState(false);
  const [userActivityBookmark, setUserActivityBookmark] = useState<string>('');
  const [collectedBookmark, setCollectedBookmark] = useState<string>('');
  const [userActivityHasMore, setUserActivityHasMore] = useState<boolean>(true);
  const [collectedHasMore, setCollectedHasMore] = useState<boolean>(true);
  const [reviewsBookmark, setReviewsBookmark] = useState<string>('');
  const [reviewsHasMore, setReviewsHasMore] = useState<boolean>(true);

  const [numBadgesDisplayed, setNumBadgesDisplayed] = useState<number>(25);
  const [numTotalBadges, setNumTotalBadges] = useState<number>(25);
  const [collectionsArr, setCollectionsArr] = useState<BitBadgeCollection[]>([]);

  const accountInfo = accounts.accounts[cosmosAddress];

  const tabInfo = [];
  if (readme) {
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
      //Check if addressOrAccountNum is an address or account number and fetch portfolio accordingly
      if (!addressOrAccountNum) return;

      let fetchedInfo;
      if (isAddressValid(addressOrAccountNum as string)) {
        fetchedInfo = await accounts.fetchAccounts([addressOrAccountNum as string]);
      } else {
        fetchedInfo = await accounts.fetchAccountsByNumber([parseInt(addressOrAccountNum as string)]);
      }

      if (!fetchedInfo || !fetchedInfo[0]) return;

      let accountNum = fetchedInfo[0].accountNumber
      let cosmosAddr = fetchedInfo[0].cosmosAddress;
      setCosmosAddress(fetchedInfo[0].cosmosAddress);
      setReadme(fetchedInfo[0].readme ? fetchedInfo[0].readme : '');
      if (fetchedInfo[0].readme) {
        setTab('overview');
      }
      // setAcctNumber(fetchedInfo[0].accountNumber);

      if (accountNum) {
        //TODO: address redundancies between GetPortfolio repsonse and fetch collections
        const portfolioInfo = await getPortfolio(cosmosAddr);
        console.log("portfolioInfo", portfolioInfo);
        if (!portfolioInfo) return;

        setUserActivityBookmark(portfolioInfo.pagination.userActivity.bookmark);
        setCollectedBookmark(portfolioInfo.pagination.collected.bookmark);
        setUserActivityHasMore(portfolioInfo.pagination.userActivity.hasMore);
        setCollectedHasMore(portfolioInfo.pagination.collected.hasMore);
        setReviewsBookmark(portfolioInfo.pagination.reviews.bookmark);
        setReviewsHasMore(portfolioInfo.pagination.reviews.hasMore);

        await collections.fetchCollections([...portfolioInfo.collected.map((collection: any) => collection.collectionId), ...portfolioInfo.managing.map((collection: any) => collection.collectionId), ...portfolioInfo.activity.map((collection: any) => collection.collectionId)]);

        setPortfolioInfo(portfolioInfo);
      }
    }
    getPortfolioInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressOrAccountNum]);



  useEffect(() => {
    if (!portfolioInfo) return;

    const collectionsArr = portfolioInfo?.collected.map((portfolioCollection: BitBadgeCollection) => {
      const collection = collections.collections[portfolioCollection.collectionId];
      return collection ? collection.collection : null
    }).filter(x => !!x) as BitBadgeCollection[];

    //Calculate badge IDs for each collection
    const allBadgeIds: {
      collection: BitBadgeCollection
      badgeIds: IdRange[]
    }[] = [];
    for (const collection of collectionsArr) {
      if (!collection) {
        continue;
      }

      if (accountInfo) {
        allBadgeIds.push({
          badgeIds: collection.balances[accountInfo?.accountNumber || 0]?.balances.map(balance => balance.badgeIds).flat() || [],
          collection
        });
      }
    }

    //Calculate total number of badge IDs
    let total = 0;
    for (const obj of allBadgeIds) {
      for (const range of obj.badgeIds) {
        const numBadgesInRange = Number(range.end) - Number(range.start) + 1;
        total += numBadgesInRange;
      }
    }
    setNumTotalBadges(total);
    console.log("EFFECT");
  }, [collectionsArr, accountInfo, portfolioInfo, collections.collections]);

  useEffect(() => {
    if (!portfolioInfo) return;
    console.log("EFFECT2");
    console.log(portfolioInfo.collected.length);
    const collectionsArray = portfolioInfo?.collected.map((portfolioCollection: BitBadgeCollection) => {
      const collection = collections.collections[portfolioCollection.collectionId];
      return collection ? collection.collection : null
    }).filter(x => !!x) as BitBadgeCollection[];

    setCollectionsArr(collectionsArray);
    console.log(collectionsArray);
  }, [numBadgesDisplayed, collections, portfolioInfo]);


  const [reactElement, setReactElement] = useState<ReactElement | null>(null);

  useEffect(() => {
    const HtmlToReactParser = HtmlToReact.Parser();
    const reactElement = HtmlToReactParser.parse(mdParser.render(readme ? readme : ''));
    setReactElement(reactElement);
  }, [readme]);

  if (!portfolioInfo) {
    return <></>
  }



  return (
    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
          textAlign: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            marginLeft: '7vw',
            marginRight: '7vw',
            paddingLeft: '1vw',
            paddingRight: '1vw',
            paddingTop: '20px',
            background: PRIMARY_BLUE,
          }}
        >
          {/* Overview and Tabs */}
          {accountInfo && <AccountButtonDisplay accountInfo={accountInfo} />}

          <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
          {tab === 'overview' && (<>
            <br />
            <InformationDisplayCard
              span={24}
              title="About"
            >
              <div style={{ overflow: 'auto' }} >
                <div className='custom-html-style' id="description" style={{ color: PRIMARY_TEXT }} >
                  {/* <Markdown> */}
                  {reactElement}
                  {/* </Markdown> */}
                </div>
              </div>
            </InformationDisplayCard>
          </>)}
          {tab === 'collected' && (<>
            <br />
            <div style={{
              backgroundColor: PRIMARY_BLUE,
              color: PRIMARY_TEXT,
              float: 'right',
              display: 'flex',
              alignItems: 'center',
              marginRight: 16,
            }}>
              Group By:

              <Select
                className="selector"
                value={groupByCollection ? 'collection' : 'none'}
                placeholder="Default: None"
                onChange={(e: any) => {
                  setGroupByCollection(e === 'collection');
                }}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  color: PRIMARY_TEXT,
                  float: 'right',
                  marginLeft: 8,
                  minWidth: 90
                }}
                suffixIcon={
                  <DownOutlined
                    style={{ color: PRIMARY_TEXT }}
                  />
                }
              >
                <Select.Option value="none">None</Select.Option>
                <Select.Option value="collection">Collection</Select.Option>
              </Select>
            </div>

            <div style={{
              backgroundColor: PRIMARY_BLUE,
              color: PRIMARY_TEXT,
              float: 'right',
              display: 'flex',
              alignItems: 'center',
              marginLeft: 16,
              marginRight: 16,
            }}>
              View:

              <Select
                className="selector"
                value={cardView ? 'card' : 'image'}
                placeholder="Default: None"
                onChange={(e: any) => {
                  setCardView(e === 'card');
                }}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  color: PRIMARY_TEXT,
                  float: 'right',
                  marginLeft: 8
                }}
                suffixIcon={
                  <DownOutlined
                    style={{ color: PRIMARY_TEXT }}
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
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
              <InfiniteScroll
                dataLength={!groupByCollection ? numBadgesDisplayed : collectionsArr.length}
                next={async () => {
                  if (!portfolioInfo) return;

                  if (numBadgesDisplayed + 25 > numTotalBadges || groupByCollection) {
                    //if over threshold, fetch more
                    const newRes = await updatePortfolioCollected(cosmosAddress, collectedBookmark);
                    setCollectedBookmark(newRes.pagination.collected.bookmark);
                    setCollectedHasMore(newRes.pagination.collected.hasMore);

                    console.log(newRes);

                    setPortfolioInfo({
                      ...portfolioInfo,
                      collected: [...portfolioInfo.collected, ...newRes.collected]
                    });

                    await collections.fetchCollections([...newRes.collected.map((collection: any) => collection.collectionId)])
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
                  collections={collectionsArr}
                  accountInfo={accounts.accounts[cosmosAddress]}
                  cardView={cardView}
                  groupByCollection={groupByCollection}
                  pageSize={groupByCollection ? collectionsArr.length : numBadgesDisplayed}
                  hidePagination={true}
                />
              </InfiniteScroll>

              {portfolioInfo?.collected.length === 0 && !collectedHasMore && (
                <Empty
                  style={{ color: PRIMARY_TEXT }}
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
              reviews={portfolioInfo?.reviews}
              cosmosAddress={cosmosAddress}
              fetchMore={async () => {
                if (!portfolioInfo) return;

                const newRes = await updateUserReviews(cosmosAddress, reviewsBookmark);
                setReviewsBookmark(newRes.pagination.reviews.bookmark);
                setReviewsHasMore(newRes.pagination.reviews.hasMore);

                setPortfolioInfo({
                  ...portfolioInfo,
                  reviews: [...portfolioInfo.reviews, ...newRes.reviews]
                });
              }}
              hasMore={reviewsHasMore}
            />
          </>
          )}


          {tab === 'activity' && (<>
            <br />
            <ActivityTab
              userActivity={portfolioInfo?.activity}
              collection={{} as BitBadgeCollection}
              fetchMore={async () => {
                if (!portfolioInfo) return;

                const newRes = await updateUserActivity(cosmosAddress, userActivityBookmark);
                setUserActivityBookmark(newRes.pagination.userActivity.bookmark);
                setUserActivityHasMore(newRes.pagination.userActivity.hasMore);


                setPortfolioInfo({
                  ...portfolioInfo,
                  activity: [...portfolioInfo.activity, ...newRes.activity]
                });
              }}
              hasMore={userActivityHasMore}
            />
          </>
          )}
        </div>
        {
          DEV_MODE && (
            <pre style={{ color: PRIMARY_TEXT }}>
              PORTFOLIO INFO: {JSON.stringify(portfolioInfo, null, 2)}
            </pre>
          )
        }
        <Divider />
      </Content >
    </Layout >
  );
}

export default PortfolioPage;
