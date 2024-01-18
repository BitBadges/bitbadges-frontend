import { Divider, Layout, Spin, Typography } from 'antd';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { BigIntify, GetFollowDetailsRouteSuccessResponse, convertBitBadgesCollection, convertGetFollowDetailsRouteSuccessResponse, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useBrowseContext } from '../bitbadges-api/contexts/BrowseContext';
import { AccountHeader } from '../components/badges/AccountHeader';
import { AddressListCard } from '../components/badges/AddressListCard';
import { CollectionHeader } from '../components/badges/CollectionHeader';
import { MultiCollectionBadgeDisplay } from "../components/badges/MultiCollectionBadgeDisplay";
import { ActivityTab } from '../components/collection-page/TransferActivityDisplay';
import CustomCarousel from '../components/display/Carousel';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { Tabs } from '../components/navigation/Tabs';
import { MarkdownDisplay } from './account/[addressOrUsername]/settings';
import { getFollowDetails } from '../bitbadges-api/api';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../bitbadges-api/contexts/accounts/AccountsContext';


const { Content } = Layout;

function BrowsePage() {
  const browseContext = useBrowseContext();
  const browseInfo = browseContext.browse;
  const router = useRouter();
  const chain = useChainContext();
  const signedInAccountInfo = useAccount(chain.address);
  const [tab, setTab] = useState('featured');
  const cardView = false;

  const [collectionsTab, setCollectionsTab] = useState('featured');
  const [badgesTab, setBadgesTab] = useState('featured');
  const [listsTab, setListsTab] = useState('latest');

  const [containerWidth, setContainerWidth] = useState<number>(0);

  const [followDetails, setFollowDetails] = useState<GetFollowDetailsRouteSuccessResponse<bigint>>();
  const [activityTab, setActivityTab] = useState('all');

  useEffect(() => {
    if (!signedInAccountInfo?.cosmosAddress) return;
    getFollowDetails({ cosmosAddress: signedInAccountInfo.cosmosAddress, activityBookmark: '' }).then(res => {
      setFollowDetails(convertGetFollowDetailsRouteSuccessResponse(res, BigIntify))
    })
  }, [signedInAccountInfo?.cosmosAddress]);

  useLayoutEffect(() => {
    const handleResize = () => {
      const container = document.querySelector('.profile-carousel') as HTMLElement;
      setContainerWidth(container.clientWidth);
    };

    setContainerWidth(document.querySelector('.profile-carousel')?.clientWidth ?? 0);

    // Initial measurement and resize event listener
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const badgeItems = useMemo(() => {
    const allItems: ReactElement[] = [];
    for (let idx = 0; idx < (browseInfo?.badges[badgesTab] ?? []).length; idx++) {
      const badgeObj = browseInfo?.badges[badgesTab][idx];
      if (!badgeObj) continue;

      const collection = convertBitBadgesCollection(badgeObj.collection, BigIntify);
      const badgeIds = badgeObj.badgeIds;

      for (const badgeIdRange of badgeIds) {
        for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
          const badgeId = BigInt(i)
          const metadata = getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []);
          allItems.push(<InformationDisplayCard title='' key={collection.collectionId + i + "" + idx} md={8} xs={24} sm={24}>
            <CollectionHeader collectionId={collection.collectionId} badgeId={badgeId} multiDisplay />
            <br />
            <MarkdownDisplay markdown={metadata?.description ?? ''} showMoreHeight={100} />
          </InformationDisplayCard>);

        }
      }
    }

    return allItems;
  }, [browseInfo, badgesTab]);

  const badgeNumItemsPerPage = 3;

  const collectionItems = useMemo(() => {
    const allItems: ReactElement[] = [];
    for (const collection of browseInfo?.collections[collectionsTab] ?? []) {
      allItems.push(<MultiCollectionBadgeDisplay
        hideCollectionLink
        key={`${collection.collectionId}`}
        collectionIds={[collection.collectionId]}
        browseDisplay
        groupByCollection
        cardView={cardView}
        span={24}
      />)
    }

    return allItems;
  }, [browseInfo, collectionsTab, cardView]);

  const collectionsItemWidth = 350; // Set the width of each carousel item (adjust as needed)
  const collectionNumItemsPerPage = Math.floor(containerWidth / collectionsItemWidth) ? Math.floor(containerWidth / collectionsItemWidth) : 1;



  const getTabInfos = (object?: any) => {
    if (!object) return [];

    const keys = Object.keys(object);
    return keys.map(category => {

      return {
        key: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        content: <div>
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </div>
      }
    })
  }

  const addressListsItemWidth = 225; // Set the width of each carousel item (adjust as needed)
  const addressListsNumItemsPerPage = Math.floor(containerWidth / addressListsItemWidth) ? Math.floor(containerWidth / addressListsItemWidth) : 1;
  const addressListsItems = useMemo(() => {
    const allItems: ReactElement[] = [];
    for (const addressList of browseInfo?.addressLists[listsTab] ?? []) {
      allItems.push(<AddressListCard
        addressList={addressList}
        key={addressList.listId}
      />)
    }

    return allItems;
  }, [browseInfo, listsTab]);


  const profileItemWidth = 330; // Set the width of each carousel item (adjust as needed)
  const profileNumItemsPerPage = Math.round(containerWidth / profileItemWidth) ? Math.round(containerWidth / profileItemWidth) : 1;

  const profileItems = useMemo(() => {
    const allItems: ReactElement[] = [];
    for (const profile of browseInfo?.profiles[tab] ?? []) {
      allItems.push(<InformationDisplayCard title='' key={profile.cosmosAddress}>
        <>
          <div style={{ alignItems: 'normal' }}>
            <AccountHeader
              addressOrUsername={profile.address}
              multiDisplay
            />
          </div>
        </>
      </InformationDisplayCard>)
    }

    return allItems;
  }, [browseInfo, tab, router]);

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
          <Typography.Text strong className='primary-text' style={{ fontSize: 30, margin: 6, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
            Badges
          </Typography.Text>
          <CustomCarousel
            title={
              <Tabs
                style={{ margin: 6 }}
                fullWidth
                theme='dark'
                tabInfo={getTabInfos(browseInfo?.badges)}
                setTab={setBadgesTab}
                tab={badgesTab}
              />
            }
            numPerPage={badgeNumItemsPerPage}
            items={badgeItems}
          />
          < Divider />

          <Typography.Text strong className='primary-text' style={{ fontSize: 30, margin: 6, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
            Collections
          </Typography.Text>
          <CustomCarousel
            title={
              <Tabs
                style={{ margin: 6 }}
                fullWidth
                theme='dark'
                tabInfo={getTabInfos(browseInfo?.collections)}
                setTab={setCollectionsTab}
                tab={collectionsTab}
              />
            }
            numPerPage={collectionNumItemsPerPage}
            items={collectionItems}
          />
          <Divider />
          <Typography.Text strong className='primary-text' style={{ fontSize: 30, margin: 6, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
            Address Lists
          </Typography.Text>
          <CustomCarousel
            title={
              <Tabs
                style={{ margin: 6 }}
                theme='dark'
                tabInfo={getTabInfos(browseInfo?.addressLists)}
                setTab={setListsTab}
                tab={listsTab}
              />
            }
            items={addressListsItems}
            numPerPage={addressListsNumItemsPerPage}
          />

          <Divider />
          <Typography.Text strong className='primary-text' style={{ fontSize: 30, margin: 6, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
            Profiles
          </Typography.Text>
          <div className="profile-carousel">
            <CustomCarousel
              title={
                <Tabs
                  style={{ margin: 6 }}
                  theme='dark'
                  tabInfo={getTabInfos(browseInfo?.profiles)}
                  setTab={setTab}
                  tab={tab}
                />
              }
              items={profileItems}
              numPerPage={profileNumItemsPerPage}
            />
          </div>
          < Divider />
          <Typography.Text strong className='primary-text' style={{ fontSize: 30, margin: 6, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
            Activity
          </Typography.Text>
          {(followDetails?.activity ?? []).length > 0 && <>
            <Tabs
              style={{ margin: 6 }}
              theme='dark'
              tabInfo={[
                {
                  key: 'all',
                  content: <div>
                    All
                  </div>
                },
                {
                  key: 'follows',
                  content: <div>
                    Following
                  </div>
                },
              ]}
              setTab={setActivityTab}
              tab={activityTab}
            />
          </>}
          <div className='full-width' style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', margin: 6 }}>
            <ActivityTab
              activity={
                activityTab == 'follows' ? followDetails?.activity ?? [] : browseInfo?.activity ?? []}
              hasMore={activityTab == 'follows' ? followDetails?.activityPagination.hasMore ?? true : false}
              fetchMore={async () => {
                if (activityTab == 'follows') {
                  const newFollowDetails = await getFollowDetails({
                    cosmosAddress: signedInAccountInfo?.cosmosAddress ?? '',
                    activityBookmark: followDetails?.activityPagination.bookmark ?? ''
                  });
                  setFollowDetails({
                    ...newFollowDetails,
                    activity: [...(followDetails?.activity ?? []), ...(newFollowDetails.activity ?? [])]
                  })
                }

              }}
            />
          </div>
        </div>

      </div>


      <Divider />
    </Content >
  );
}

export default BrowsePage;
