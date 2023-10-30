import { Divider, Layout, Spin, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useAccountsContext } from '../bitbadges-api/contexts/accounts/AccountsContext';
import { useBrowseContext } from '../bitbadges-api/contexts/BrowseContext';
import { AddressListCard } from '../components/badges/AddressListCard';
import { MultiCollectionBadgeDisplay } from "../components/badges/MultiCollectionBadgeDisplay";
import { AccountButtonDisplay } from '../components/button-displays/AccountButtonDisplay';
import { ActivityTab } from '../components/collection-page/TransferActivityDisplay';
import CustomCarousel from '../components/display/Carousel';
import { Tabs } from '../components/navigation/Tabs';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack } from '@fortawesome/free-solid-svg-icons';

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


  useLayoutEffect(() => {
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
  }, [listsTab, browseInfo])


  return (
    <Content
      style={{
        textAlign: 'center',
        minHeight: '100vh',
      }}
      className=''
    >
      <div className=''
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

          <Typography.Text strong className='dark:text-white text-4xl text-slate-700 dark:text-white' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
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
                      content: <Typography.Text strong className='dark:text-white' style={{ fontSize: 18, fontWeight: 'bold' }}>
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
                  if (idx >= 4) return null;
                  profile = browseInfo?.profiles[tab][idx];
                  return <InformationDisplayCard title='' key={idx} style={{ margin: 16 }}>
                    <>
                      <div style={{ alignItems: 'normal' }}>
                        <AccountButtonDisplay
                          addressOrUsername={profile.address}
                          hideButtons
                        />
                      </div>


                      <b>Pinned <FontAwesomeIcon
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
                        customPageBadges={profile.customPages?.find(x => x.title === 'Pinned Badges')?.badges ?? []}
                        // size={75}
                        hidePagination
                        defaultPageSize={3}
                      />


                      <div style={{ marginTop: '1rem' }}></div>
                      <a className='text-vivid-blue' onClick={() => {
                        router.push(`/account/${profile.address}`)
                      }}
                        style={{ fontSize: 16 }}
                      >
                        See full profile
                      </a>
                    </>
                  </InformationDisplayCard>
                }).filter(x => x)}</div>
              }).filter(x => x) ?? []}
            />
          </div>
          < Divider />
          <Typography.Text strong className='dark:text-white text-slate-700 dark:text-white' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
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
                    content: <Typography.Text strong className='dark:text-white' style={{ fontSize: 18, fontWeight: 'bold' }}>
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
                return <div title='' key={idx} style={{ margin: 16, width: 350 }}>
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
          <Typography.Text strong className='dark:text-white text-slate-700 dark:text-white' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
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
                    content: <Typography.Text strong className='dark:text-white' style={{ fontSize: 18, fontWeight: 'bold' }}>
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
                return <div className='dark:text-white' key={idx} style={{ margin: 16 }}>
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
          <Typography.Text strong className='dark:text-white text-slate-700 dark:text-white' style={{ fontSize: 36, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
            Activity
          </Typography.Text>
          <div className='full-width' style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            <ActivityTab
              activity={browseInfo?.activity ?? []}
              hasMore={false}
              fetchMore={async () => { }}
            />
          </div>
        </div>

      </div>


      <Divider />
    </Content >
  );
}

export default BrowsePage;
