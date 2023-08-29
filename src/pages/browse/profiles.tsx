import { Divider, Layout, Spin, Typography } from 'antd';
import { useState } from 'react';
import { useBrowseContext } from '../../bitbadges-api/contexts/BrowseContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { BlockiesAvatar } from '../../components/address/Blockies';
import { MultiCollectionBadgeDisplay } from '../../components/badges/MultiCollectionBadgeDisplay';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { Tabs } from '../../components/navigation/Tabs';

const { Content } = Layout;

function BrowsePage() {
  const browseContext = useBrowseContext();
  const browseInfo = browseContext.browse;
  const [tab, setTab] = useState('featured');

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
            tabInfo={browseInfo ? Object.keys(browseInfo.profiles).map(category => {

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
          <div className='full-width'>
            {/* <br /> */}
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', width: '100%' }}>
              {browseInfo && browseInfo.profiles[tab]?.map((profile, idx) => {
                return <>
                  <>
                    <InformationDisplayCard
                      key={idx}
                      md={11} sm={24} xs={24}
                      style={{ margin: 8 }}
                      title={<>
                        <div className='flex-center full-width primary-text' style={{ marginTop: '1rem' }}>
                          <BlockiesAvatar shape='circle' fontSize={150} address={profile.address} avatar={profile.profilePicUrl ? profile.profilePicUrl : profile.avatar ? profile.avatar : undefined} />
                        </div>

                        <AddressDisplay
                          addressOrUsername={profile.address}
                          fontSize={16}
                        />
                        <br />
                      </>}
                    >
                      <MultiCollectionBadgeDisplay
                        collectionIds={profile.collected.map(collected => collected.collectionId)}
                        addressOrUsernameToShowBalance={profile.address}
                      // size={75}
                      />



                    </InformationDisplayCard>
                  </>

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
