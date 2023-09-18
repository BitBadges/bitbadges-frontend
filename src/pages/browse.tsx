import { Divider, Layout, Spin, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../bitbadges-api/contexts/AccountsContext';
import { useBrowseContext } from '../bitbadges-api/contexts/BrowseContext';
import { AddressListCard } from '../components/badges/AddressListCard';
import { MultiCollectionBadgeDisplay } from "../components/badges/MultiCollectionBadgeDisplay";
import { AccountButtonDisplay } from '../components/button-displays/AccountButtonDisplay';
import { ActivityTab } from '../components/collection-page/TransferActivityDisplay';
import CustomCarousel from '../components/display/Carousel';
import { Tabs } from '../components/navigation/Tabs';

const { Content } = Layout;

function BrowsePage() {
  const browseContext = useBrowseContext();
  const accounts = useAccountsContext();
  const browseInfo = browseContext.browse;
  const router = useRouter();
  const [tab, setTab] = useState('featured');
  // const [cardView, setCardView] = useState(false);
  const cardView = false;

  const [badgesTab, setBadgesTab] = useState('latest');
  const [listsTab, setListsTab] = useState('latest');

  const [containerWidth, setContainerWidth] = useState<number>(0);


  useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector('.profile-carousel') as HTMLElement;
      setContainerWidth(container.clientWidth);
    };

    // Initial measurement and resize event listener
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  useEffect(() => {
    const accountsToFetch = browseInfo?.addressMappings[listsTab]?.map(addressMapping => addressMapping.createdBy) || [];
    if (accountsToFetch.length > 0) {
      accounts.fetchAccounts(accountsToFetch);
    }
  }, []);

  useEffect(() => {
    const accountsToFetch = browseInfo?.addressMappings[listsTab]?.map(addressMapping => addressMapping.createdBy) || [];
    if (accountsToFetch.length > 0) {
      accounts.fetchAccounts(accountsToFetch);
    }
  }, [listsTab, browseInfo])


  return (
    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
          textAlign: 'center',
          minHeight: '100vh',
        }}
      >
        <div className='primary-blue-bg'
          style={{
            marginLeft: '4vw',
            marginRight: '4vw',
            paddingLeft: '2vw',
            paddingRight: '2vw',
            paddingTop: '20px',
          }}
        >
          {/* antd tabs */}


          {!browseInfo && <Spin size='large' />}
          <div className='full-width'>
            <br />
            {/* 
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
            </div> */}

            <Typography.Text strong className='primary-text' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
              Profiles
            </Typography.Text>
            <div className="profile-carousel">
              <CustomCarousel

                title={
                  <Tabs

                    theme='dark'
                    tabInfo={browseInfo ? Object.keys(browseInfo.profiles).map(category => {

                      return {
                        key: category,
                        label: category.charAt(0).toUpperCase() + category.slice(1),
                        content: <Typography.Text strong className='primary-text' style={{ fontSize: 18, fontWeight: 'bold' }}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Typography.Text>
                      }
                    }) : []}
                    setTab={setTab}
                    tab={tab}
                  />
                }
                items={browseInfo?.profiles[tab]?.map((profile, idx) => {
                  const itemWidth = 251 + 16 * 2; // Set the width of each carousel item (adjust as needed)
                  const numItems = Math.floor(containerWidth / itemWidth) ? Math.floor(containerWidth / itemWidth) : 1;

                  const idxArr = new Array(numItems);
                  for (let i = 0; i < idxArr.length; i++) {
                    idxArr[i] = idx + i;
                  }
                  if (idx % numItems !== 0) return null

                  return <div key={idx} className='flex flex-center-if-mobile'

                  >{idxArr.map(idx => {
                    if (idx >= browseInfo?.profiles[tab]?.length) return null
                    profile = browseInfo?.profiles[tab][idx];
                    return <div className='primary-text' key={idx} style={{ margin: 16 }}>
                      <>
                        <div style={{ alignItems: 'normal' }}>
                          <AccountButtonDisplay
                            addressOrUsername={profile.address}
                            hideButtons
                          />
                        </div>

                        <a onClick={() => {
                          router.push(`/account/${profile.address}`)
                        }}
                          style={{ fontSize: 16 }}
                        >
                          See full profile
                        </a>
                        <div style={{ marginTop: '1rem' }}></div>

                        {/* <b>Pinned <FontAwesomeIcon
                          icon={faThumbtack}
                          style={{
                            color: 'gold',
                            marginRight: 8,
                          }}
                        />
                        </b>
                        <MultiCollectionBadgeDisplay
                          collectionIds={profile.collected.map(collected => collected.collectionId)}
                          addressOrUsernameToShowBalance={profile.address}
                          cardView={cardView}
                          // size={75}
                          hidePagination
                          defaultPageSize={3}
                        /> */}
                      </>
                    </div>
                  }).filter(x => x)}</div>
                }).filter(x => x) ?? []}
              />
            </div>
            < Divider />
            <Typography.Text strong className='primary-text' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
              Badges
            </Typography.Text>
            <CustomCarousel
              title={
                <Tabs
                  fullWidth
                  theme='dark'
                  tabInfo={browseInfo ? Object.keys(browseInfo.collections).map(category => {

                    return {
                      key: category,
                      label: category.charAt(0).toUpperCase() + category.slice(1),
                      content: <Typography.Text strong className='primary-text' style={{ fontSize: 18, fontWeight: 'bold' }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Typography.Text>
                    }
                  }) : []}
                  setTab={setBadgesTab}
                  tab={badgesTab}
                />
              }
              items={(browseInfo && browseInfo.collections[badgesTab]?.map((collection, idx) => {
                const itemWidth = 350 + 16 * 2; // Set the width of each carousel item (adjust as needed)
                const numItems = Math.floor(containerWidth / itemWidth) ? Math.floor(containerWidth / itemWidth) : 1;

                const idxArr = new Array(numItems);
                for (let i = 0; i < idxArr.length; i++) {
                  idxArr[i] = idx + i;
                }
                if (idx % numItems !== 0) return null
                return <div key={idx} className='flex flex-center-if-mobile full-width'
                >{idxArr.map(idx => {
                  if (idx >= browseInfo?.collections[badgesTab]?.length) return null
                  collection = browseInfo?.collections[badgesTab][idx];
                  return <div className='primary-text' key={idx} style={{ margin: 16, width: 350 }}>
                    <MultiCollectionBadgeDisplay
                      collectionIds={[collection.collectionId]}
                      groupByCollection
                      cardView={cardView}
                      key={idx}
                    />
                  </div>
                }).filter(x => x)}</div>


                // console.log(collection);
                // return <MultiCollectionBadgeDisplay
                //   collectionIds={[collection.collectionId]}
                //   groupByCollection
                //   cardView={cardView}
                //   key={idx}
                // />
              }).filter(x => x)) ?? []}
            />
            <Divider />
            <Typography.Text strong className='primary-text' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
              Address Lists
            </Typography.Text>
            <CustomCarousel
              title={
                <Tabs

                  theme='dark'
                  tabInfo={browseInfo ? Object.keys(browseInfo.addressMappings).map(category => {

                    return {
                      key: category,
                      label: category.charAt(0).toUpperCase() + category.slice(1),
                      content: <Typography.Text strong className='primary-text' style={{ fontSize: 18, fontWeight: 'bold' }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Typography.Text>
                    }
                  }) : []}
                  setTab={setListsTab}
                  tab={listsTab}
                />
              }
              items={browseInfo?.addressMappings[listsTab]?.map((addressMapping, idx) => {
                const itemWidth = 225 + 16 * 2; // Set the width of each carousel item (adjust as needed)
                const numItems = Math.floor(containerWidth / itemWidth) ? Math.floor(containerWidth / itemWidth) : 1;

                const idxArr = new Array(numItems);
                for (let i = 0; i < idxArr.length; i++) {
                  idxArr[i] = idx + i;
                }
                if (idx % numItems !== 0) return null
                return <div key={idx} className='flex flex-center-if-mobile'

                >{idxArr.map(idx => {
                  if (idx >= browseInfo?.addressMappings[listsTab]?.length) return null
                  addressMapping = browseInfo?.addressMappings[listsTab][idx];
                  return <div className='primary-text' key={idx} style={{ margin: 16 }}>
                    <> <AddressListCard
                      addressMapping={addressMapping}
                      key={idx}
                    />
                    </>
                  </div>
                }).filter(x => x)}</div>
              }).filter(x => x) ?? []}
            />

            <Divider />
            <Typography.Text strong className='primary-text' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
              Activity
            </Typography.Text>
            <div className='full-width' style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
              <ActivityTab
                activity={browseInfo?.activity ?? []}
                hasMore={false}
                fetchMore={() => { }}
              />
            </div>
          </div>

        </div>


        <Divider />
      </Content >
    </Layout >
  );
}

export default BrowsePage;
