import { Divider, Layout, Spin, Tabs } from 'antd';
import { GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getBrowseCollections } from '../bitbadges-api/api';
import { useCollectionsContext } from '../bitbadges-api/contexts/CollectionsContext';
import { MultiCollectionBadgeDisplay } from '../components/badges/MultiCollectionBadgeDisplay';
import { INFINITE_LOOP_MODE } from '../constants';

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

      const updatedIds: bigint[] = [];
      for (const category of Object.keys(browseInfo)) {
        for (const collection of browseInfo[category]) {

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
          {/* 
          tab={tab}
            setTab={setTab}
            tabInfo={browseInfo ? Object.keys(browseInfo).map(category => {
              return {
                key: category,
                onClick: () => setTab(category),
                //uppercase first letter
                content: category.charAt(0).toUpperCase() + category.slice(1),
              }
            }) : []}
            theme='dark'
            fullWidth */}

          {/* antd tabs */}
          <Tabs
            defaultActiveKey="latest"
            onChange={(key) => setTab(key)}
            style={{ textAlign: 'center' }}
            color='white'
            size='large'
            type='line'
            tabBarStyle={{ color: 'white' }}
            tabPosition='top'
            centered
            items={
              browseInfo ? Object.keys(browseInfo).map((category) => {
                return { label: category.charAt(0).toUpperCase() + category.slice(1), key: category }
              }) : [{ label: 'Latest', key: 'latest' }]}
          >

          </Tabs>

          {!browseInfo && <Spin size='large' />}
          <div>
            <br />
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
              <MultiCollectionBadgeDisplay
                collectionIds={(browseInfo && browseInfo[tab]?.map(collection => collection.collectionId)) ?? []}
                groupByCollection
              />

              {/* {browseInfo && browseInfo[tab]?.map((portfolioCollection: BitBadgesCollection<bigint>, idx) => {
                const collection = collections.collections[portfolioCollection.collectionId.toString()]
                if (!collection) return null;

                return <>
                  <CollectionDisplay
                    key={idx}
                    collectionId={portfolioCollection.collectionId}
                  />
                </>
              })} */}
            </div>
          </div>
        </div>

        <Divider />
      </Content >
    </Layout >
  );
}

export default BrowsePage;
