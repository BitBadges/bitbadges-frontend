import { Card, Divider, Layout, Spin, Typography } from 'antd';
import { GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBrowseCollections } from '../../bitbadges-api/api';
import { BadgeAvatar } from '../../components/badges/BadgeAvatar';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../constants';

const { Content } = Layout;

function BrowsePage() {
  const router = useRouter();


  const [browseInfo, setBrowseInfo] = useState<GetBrowseCollectionsRouteSuccessResponse<bigint>>();
  const [tab, setTab] = useState('latest');

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
          <Tabs
            fullWidth
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
            setTab={setTab}
            tab={tab}
          />

          {!browseInfo && <Spin size='large' />}
          <div>
            {/* <br /> */}
            <div className='full-width flex-center flex-wrap'>
              {browseInfo?.addressMappings[tab]?.map((addressMapping, idx) => {
                return <div key={idx} style={{ margin: 16 }}>
                  <Card
                    className='primary-text primary-blue-bg'
                    style={{
                      width: 175,
                      margin: 8,
                      textAlign: 'center',
                      borderRadius: '8%',
                    }}
                    hoverable={true}
                    onClick={() => {
                      router.push(`/addresses/${addressMapping.mappingId}`);
                    }}
                    cover={<>
                      <div className='flex-center full-width primary-text' style={{ marginTop: '1rem' }}>
                        <BadgeAvatar
                          collectionId={0n}
                          metadataOverride={addressMapping.metadata}
                          size={75}
                        />
                      </div>

                    </>
                    }
                  >
                    <Typography.Text strong className='primary-text'>
                      {addressMapping.metadata?.name}
                    </Typography.Text>
                  </Card>

                </div>
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
