import { Divider, Layout, Spin, Typography } from 'antd';
import { useRouter } from 'next/router';
import { ReactElement, useLayoutEffect, useMemo, useState } from 'react';

import { BigIntify, convertBitBadgesCollection, getMetadataForBadgeId } from 'bitbadgesjs-utils';
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


const { Content } = Layout;

function BrowsePage() {
  const browseContext = useBrowseContext();
  const browseInfo = browseContext.browse;
  const router = useRouter();
  const [tab, setTab] = useState('featured');
  const cardView = false;

  const [collectionsTab, setCollectionsTab] = useState('featured');
  const [badgesTab, setBadgesTab] = useState('featured');
  const [listsTab, setListsTab] = useState('latest');

  const [containerWidth, setContainerWidth] = useState<number>(0);


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

  const allItems = useMemo(() => {
    const allItems: ReactElement[] = [];
    for (let idx = 0; idx < (browseInfo?.badges[badgesTab] ?? []).length; idx++) {
      const badgeObj = browseInfo?.badges[badgesTab][idx];
      if (!badgeObj) continue;

      const collection = convertBitBadgesCollection(badgeObj.collection, BigIntify);
      const badgeIds = badgeObj.badgeIds.map(x => { return { start: BigInt(x.start), end: BigInt(x.end) } });

      allItems.push(...badgeIds.map(badgeIdRange => {
        const start = badgeIdRange.start;
        const end = badgeIdRange.end;
        let arr = [];
        for (let i = 0; i < end - start + 1n; i++) {
          arr.push(start + BigInt(i));
        }

        return arr.map((_, idx) => {
          const badgeId = start + BigInt(idx);
          const metadata = getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []);

          return <InformationDisplayCard title='' key={collection.collectionId + "" + idx} md={8} xs={24} sm={24}>
            <CollectionHeader collectionId={collection.collectionId} badgeId={badgeId} multiDisplay />
            <br />
            <MarkdownDisplay markdown={metadata?.description ?? ''} />
          </InformationDisplayCard>
        }).flat();

      }).flat());
    }

    return allItems;
  }, [browseInfo, badgesTab]);


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
                tabInfo={browseInfo ? Object.keys(browseInfo.badges).map(category => {

                  return {
                    key: category,
                    label: category.charAt(0).toUpperCase() + category.slice(1),
                    content: <div>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  }
                }) : []}
                setTab={setBadgesTab}
                tab={badgesTab}
              />
            }
            items={(browseInfo && allItems?.map((_, idx) => {
              const itemWidth = 350; // Set the width of each carousel item (adjust as needed)
              const numItems = Math.floor(containerWidth / itemWidth) ? Math.floor(containerWidth / itemWidth) : 1;

              const idxArr = new Array(numItems);
              for (let i = 0; i < idxArr.length; i++) {
                idxArr[i] = idx + i;
              }
              if (idx % numItems !== 0) return null

              return <div key={idx} className='flex flex-center-if-mobile'>
                {idxArr.map(idx => {
                  if (idx >= allItems?.length) return null
                  return allItems[idx];

                }).filter(x => x).flat()}
              </div>
            }).filter(x => x))?.flat() ?? []
            }
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
                tabInfo={browseInfo ? Object.keys(browseInfo.collections).map(category => {

                  return {
                    key: category,
                    label: category.charAt(0).toUpperCase() + category.slice(1),
                    content: <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  }
                }) : []}
                setTab={setCollectionsTab}
                tab={collectionsTab}
              />
            }
            items={(browseInfo && browseInfo.collections[collectionsTab]?.map((_, idx) => {



              const itemWidth = 350; // Set the width of each carousel item (adjust as needed)
              const numItems = Math.floor(containerWidth / itemWidth) ? Math.floor(containerWidth / itemWidth) : 1;

              const idxArr = new Array(numItems);
              for (let i = 0; i < idxArr.length; i++) {
                idxArr[i] = idx + i;
              }
              if (idx % numItems !== 0) return null

              return <div key={idx} className='flex flex-center-if-mobile'
              >{idxArr.map(idx => {
                if (idx >= browseInfo?.collections[collectionsTab]?.length) return null
                const collection = browseInfo?.collections[collectionsTab][idx];
                return <MultiCollectionBadgeDisplay
                  hideCollectionLink
                  collectionIds={[collection.collectionId]}
                  groupByCollection
                  cardView={cardView}
                  span={24}
                  key={idx}
                />
              }).filter(x => x)}</div>
            }).filter(x => x)) ?? []}
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
                tabInfo={browseInfo ? Object.keys(browseInfo.addressMappings).map(category => {

                  return {
                    key: category,
                    label: category.charAt(0).toUpperCase() + category.slice(1),
                    content: <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  }
                }) : []}
                setTab={setListsTab}
                tab={listsTab}
              />
            }
            items={browseInfo?.addressMappings[listsTab]?.map((_, idx) => {
              const itemWidth = 225; // Set the width of each carousel item (adjust as needed)
              const numItems = Math.floor(containerWidth / itemWidth) ? Math.floor(containerWidth / itemWidth) : 1;

              const idxArr = new Array(numItems);
              for (let i = 0; i < idxArr.length; i++) {
                idxArr[i] = idx + i;
              }
              if (idx % numItems !== 0) return null


              return <div key={idx} className='flex flex-center-if-mobile full-width'

              >{idxArr.map(idx => {
                if (idx >= browseInfo?.addressMappings[listsTab]?.length) return null
                const addressMapping = browseInfo?.addressMappings[listsTab][idx];
                return <> <AddressListCard
                  addressMapping={addressMapping}
                  key={idx}
                />
                </>
              }).filter(x => x)}</div>
            }).filter(x => x) ?? []}
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
                  tabInfo={browseInfo ? Object.keys(browseInfo.profiles).map(category => {

                    return {
                      key: category,
                      label: category.charAt(0).toUpperCase() + category.slice(1),
                      content: <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                    }
                  }) : []}
                  setTab={setTab}
                  tab={tab}
                />
              }
              items={browseInfo?.profiles[tab]?.map((_, idx) => {
                const itemWidth = 330; // Set the width of each carousel item (adjust as needed)
                const numItems = Math.round(containerWidth / itemWidth) ? Math.round(containerWidth / itemWidth) : 1;


                const idxArr = new Array(numItems);
                for (let i = 0; i < idxArr.length; i++) {
                  idxArr[i] = idx + i;
                }
                if (idx % numItems !== 0) return null

                return <div key={idx} className='flex flex-center-if-mobile full-width'

                >{idxArr.map(idx => {
                  if (idx >= browseInfo?.profiles[tab]?.length) return null
                  const profile = browseInfo?.profiles[tab][idx];

                  return <InformationDisplayCard title='' key={idx} style={{}}>
                    <>
                      <div style={{ alignItems: 'normal' }}>
                        <AccountHeader
                          addressOrUsername={profile.address}
                          multiDisplay
                        />
                      </div>

                      <br />
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
          <Typography.Text strong className='primary-text' style={{ fontSize: 30, margin: 6, display: 'flex', fontWeight: 'bold', textAlign: 'start', alignItems: 'normal', marginBottom: 13 }}>
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
