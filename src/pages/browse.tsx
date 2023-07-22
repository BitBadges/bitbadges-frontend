import { Divider, Layout, Tabs } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { getBrowseCollections } from '../bitbadges-api/api';
import { CollectionDisplay } from '../components/collections/CollectionDisplay';
import { useCollectionsContext } from '../bitbadges-api/contexts/CollectionsContext';
import { BitBadgesCollection, GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-utils';

const { Content } = Layout;

function BrowsePage() {
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);

  const [browseInfo, setBrowseInfo] = useState<GetBrowseCollectionsRouteSuccessResponse<bigint>>();
  const [tab, setTab] = useState('featured');

  useEffect(() => {
    async function getCollections() {
      const browseInfo = await getBrowseCollections();
      if (!browseInfo) return;

      for (const category of Object.keys(browseInfo)) {
        for (const collection of browseInfo[category]) {
          collectionsRef.current.updateCollection(collection);
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
            defaultActiveKey="featured"
            onChange={(key) => setTab(key)}
            style={{ textAlign: 'center' }}
            color='white'
            size='large'
            type='line'
            tabBarStyle={{ color: 'white' }}
            tabPosition='top'
            centered
          >
            {browseInfo ? Object.keys(browseInfo).map(category => {
              return <Tabs.TabPane tab={category.charAt(0).toUpperCase() + category.slice(1)} key={category} />
            }) : []}
          </Tabs>


          <div>
            <br />
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {browseInfo && browseInfo[tab]?.map((portfolioCollection: BitBadgesCollection<bigint>) => {
                const collection = collections.collections[portfolioCollection.collectionId.toString()]
                if (!collection) return null;

                return <>
                  <CollectionDisplay
                    key={portfolioCollection.collectionId.toString()}
                    collectionId={portfolioCollection.collectionId}
                  />
                </>
              })}
            </div>
          </div>
        </div>

        <Divider />
      </Content >
    </Layout >
  );
}

export default BrowsePage;
