import { InfoCircleOutlined } from '@ant-design/icons';
import { Layout, notification } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { addAddressToSurvey } from '../bitbadges-api/api';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../components/address/AddressDisplay';
import { AddressSelect } from '../components/address/AddressSelect';
import { BlockinDisplay } from '../components/blockin/BlockinDisplay';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { Tabs } from '../components/navigation/Tabs';

const { Content } = Layout;

function AddressCollectionScreen() {
  const router = useRouter();
  const { listId, description, callbackRequired, editKey } = router.query;

  const chain = useChainContext();

  const [selectedUser, setSelectedUser] = useState<string>(chain.address || '');
  const [tab, setTab] = useState<string>('search');

  useEffect(() => {
    setSelectedUser(chain.address || '');
  }, [chain.address]);

  return (
    <Content
      className="full-area"
      style={{ minHeight: '100vh', padding: 8 }}
    >
      <div className='flex-center'>
        <InformationDisplayCard title='Address Survey' md={12} xs={24} sm={24} style={{ marginTop: '10px' }} subtitle={description}>
          <br />

          <div className='flex-center'>
            <Tabs
              tab={tab}
              setTab={setTab}
              tabInfo={[
                { key: 'search', content: 'Search' },
                { key: 'select', content: 'Connect Wallet' },
              ]}
              type='underline'
            />
          </div>

          {tab == 'search' && <>

            <div className='flex-center' style={{ textAlign: 'center' }}>
              <AddressSelect
                defaultValue={selectedUser}
                switchable
                onUserSelect={async (userInfo) => {
                  setSelectedUser(userInfo);
                }}
              />
            </div>
          </>}

          {tab == 'select' && <>
            <br />
            <div className='flex-center flex-column'>
              <BlockinDisplay hideLogo />
            </div>
            <br />

            <div className='flex-center'>
              <AddressDisplay addressOrUsername={selectedUser} />
            </div>
          </>}


          <br />

          {selectedUser && <>
            <br />
            <div className='flex-center'>
              <button className='landing-button' style={{ width: '90%' }} onClick={async () => {
                if (listId && editKey) {
                  await addAddressToSurvey(listId as string, { address: selectedUser, editKey: editKey as string });
                }
                if (window.opener && callbackRequired) {
                  window.opener.postMessage({ type: 'address', address: selectedUser }, "*");
                }

                notification.success({
                  message: 'Address Submitted!',
                });
                if (window.opener) {
                  window.close();
                } else {
                  router.push('/');
                }

              }} disabled={!selectedUser}>
                Submit
              </button>
            </div>
            <div className='secondary-text' style={{ textAlign: 'center', marginTop: '10px' }}>
              <InfoCircleOutlined /> The selected address will be {listId ? 'submitted.' : 'sent to the website that directed you here.'}
            </div>
          </>}
        </InformationDisplayCard>
      </div>
    </ Content >
  );
}

export default AddressCollectionScreen;
