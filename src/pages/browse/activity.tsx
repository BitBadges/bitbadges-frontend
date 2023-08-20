import { Divider, Layout, Spin } from 'antd';
import { useBrowseContext } from '../../bitbadges-api/contexts/BrowseContext';
import { ActivityTab } from '../../components/activity/TransferActivityDisplay';

const { Content } = Layout;

function BrowsePage() {

  const browseContext = useBrowseContext();
  const browseInfo = browseContext.browse;

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
            marginLeft: '5vw',
            marginRight: '5vw',
            paddingLeft: '1vw',
            paddingRight: '1vw',
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
