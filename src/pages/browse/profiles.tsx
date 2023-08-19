import { Divider, Layout, Spin, Typography } from 'antd';
import { GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getBrowseCollections } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { BlockiesAvatar } from '../../components/address/Blockies';
import { MultiCollectionBadgeDisplay } from '../../components/badges/MultiCollectionBadgeDisplay';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../constants';

const { Content } = Layout;

function BrowsePage() {
  const accounts = useAccountsContext();


  const [browseInfo, setBrowseInfo] = useState<GetBrowseCollectionsRouteSuccessResponse<bigint>>();
  const [tab, setTab] = useState('featured');

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: browse page, get collections ');
    async function getCollections() {
      const browseInfo = await getBrowseCollections();
      if (!browseInfo) return;

      console.log(browseInfo);
      console.log(Object.keys(browseInfo));

      const updatedIds: string[] = [];
      for (const category of Object.keys(browseInfo.profiles)) {
        if (!browseInfo.collections[category]) continue;
        console.log(browseInfo.collections[category]);
        for (const profile of browseInfo.profiles[category]) {

          if (updatedIds.includes(profile.cosmosAddress)) continue;
          accounts.updateAccount({
            ...profile,
          });

          updatedIds.push(profile.cosmosAddress);
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
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
              {browseInfo && browseInfo.profiles[tab]?.map((profile, idx) => {
                return <div key={idx} style={{ marginTop: 16, width: '100%' }}>
                  <InformationDisplayCard
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
