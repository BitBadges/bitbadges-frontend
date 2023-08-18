import { Divider, Layout, Spin, Typography } from 'antd';
import { GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getBrowseCollections } from '../../bitbadges-api/api';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { MultiCollectionBadgeDisplay } from '../../components/badges/MultiCollectionBadgeDisplay';
import { INFINITE_LOOP_MODE } from '../../constants';
import { Tabs } from '../../components/navigation/Tabs';

const { Content } = Layout;

function BrowsePage() {
  const collections = useCollectionsContext();


  const [browseInfo, setBrowseInfo] = useState<GetBrowseCollectionsRouteSuccessResponse<bigint>>();
  const [tab, setTab] = useState('latest');

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: browse page, get collections ');
    async function getCollections() {
      const browseInfo = await getBrowseCollections();
      if (!browseInfo) return;

      console.log(browseInfo);
      console.log(Object.keys(browseInfo));

      const updatedIds: bigint[] = [];
      for (const category of Object.keys(browseInfo.collections)) {
        if (!browseInfo.collections[category]) continue;
        console.log(browseInfo.collections[category]);
        for (const collection of browseInfo.collections[category]) {
          console.log(collection);
          if (updatedIds.includes(collection.collectionId)) continue;
          collections.updateCollection(collection);
          updatedIds.push(collection.collectionId);
        }
      }

      setBrowseInfo(browseInfo);
    }
    getCollections();
  }, []);

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
            marginLeft: '10vw',
            marginRight: '10vw',
            paddingLeft: '2vw',
            paddingRight: '2vw',
            paddingTop: '20px',
          }}
        >
          {/* antd tabs */}
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
            setTab={setTab}
            tab={tab}
          />

          {!browseInfo && <Spin size='large' />}
          <div>
            {/* <br /> */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
              <MultiCollectionBadgeDisplay
                collectionIds={(browseInfo && browseInfo.collections[tab]?.map(collection => {
                  console.log(collection);
                  return collection.collectionId
                })) ?? []}
                groupByCollection
                cardView
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
