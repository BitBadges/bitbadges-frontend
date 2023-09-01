import { Divider, Layout, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useBrowseContext } from '../../bitbadges-api/contexts/BrowseContext';
import { AddressListCard } from '../../components/badges/AddressListCard';
import { Tabs } from '../../components/navigation/Tabs';

const { Content } = Layout;

function BrowsePage() {
  const accounts = useAccountsContext();

  const browseContext = useBrowseContext();
  const browseInfo = browseContext.browse;
  const [tab, setTab] = useState('latest');

  useEffect(() => {
    const accountsToFetch = browseInfo?.addressMappings[tab]?.map(addressMapping => addressMapping.createdBy) || [];
    if (accountsToFetch.length > 0) {
      accounts.fetchAccounts(accountsToFetch);
    }
  }, []);

  useEffect(() => {
    const accountsToFetch = browseInfo?.addressMappings[tab]?.map(addressMapping => addressMapping.createdBy) || [];
    if (accountsToFetch.length > 0) {
      accounts.fetchAccounts(accountsToFetch);
    }
  }, [tab]);

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
                return <AddressListCard
                  addressMapping={addressMapping}
                  key={idx}
                />
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
