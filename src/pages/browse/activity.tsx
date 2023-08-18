import { Divider, Layout, Spin } from 'antd';
import { GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getBrowseCollections } from '../../bitbadges-api/api';
import { ActivityTab } from '../../components/activity/TransferActivityDisplay';
import { INFINITE_LOOP_MODE } from '../../constants';

const { Content } = Layout;

function BrowsePage() {

  const [browseInfo, setBrowseInfo] = useState<GetBrowseCollectionsRouteSuccessResponse<bigint>>();

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: browse page, get collections ');
    async function getCollections() {
      const browseInfo = await getBrowseCollections();
      if (!browseInfo) return;

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
          {/* <Tabs
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
          /> */}

          {!browseInfo && <Spin size='large' />}

          {/* <br /> */}
          <div className='full-width' style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            <ActivityTab
              activity={browseInfo?.activity ?? []}
              hasMore={false}
              fetchMore={() => { }}
            />
          </div>
        </div>


        <Divider />
      </Content >
    </Layout >
  );
}

export default BrowsePage;
