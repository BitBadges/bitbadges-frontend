import { Divider, Layout, Select, Spin, Typography } from 'antd';
import { useState } from 'react';
import { useBrowseContext } from '../../bitbadges-api/contexts/BrowseContext';
import { MultiCollectionBadgeDisplay } from "../../components/badges/MultiCollectionBadgeDisplay";
import { Tabs } from '../../components/navigation/Tabs';
import { DownOutlined } from '@ant-design/icons';

const { Content } = Layout;

function BrowsePage() {
  const browseContext = useBrowseContext();
  const browseInfo = browseContext.browse;

  const [tab, setTab] = useState('latest');
  const [cardView, setCardView] = useState(false);

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

          {!browseInfo ? <Spin size='large' /> : <>
            <br />

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
            </div>

            <Divider />
            <div>
              {/* <br /> */}
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                <MultiCollectionBadgeDisplay
                  collectionIds={(browseInfo && browseInfo.collections[tab]?.map(collection => {
                    console.log(collection);
                    return collection.collectionId
                  })) ?? []}
                  groupByCollection
                  cardView={cardView}
                />
              </div>
            </div>

          </>}
        </div>

        <Divider />
      </Content >
    </Layout >
  );
}

export default BrowsePage;
