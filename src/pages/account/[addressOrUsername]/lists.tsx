import { Empty, Spin } from 'antd';
import 'react-markdown-editor-lite/lib/index.css';

import { AccountViewKey } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fetchAccounts, fetchNextForAccountViews, getAccountAddressMappingsView, useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressListCard } from '../../../components/badges/AddressListCard';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';



export function PrivateListsDisplay() {
  const router = useRouter();
  const chain = useChainContext();
  const loggedIn = chain?.loggedIn;

  const { addressOrUsername } = router.query;
  const accountInfo = useAccount(addressOrUsername as string);

  const listsTab = 'privateLists';

  const fetchMoreLists = useCallback(async (address: string, viewKey: AccountViewKey) => {
    await fetchNextForAccountViews(address, [viewKey]);
  }, []);


  const listsView = getAccountAddressMappingsView(accountInfo, listsTab);
  const hasMoreAddressMappings = accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch more collected');

    const hasMoreAddressMappings = accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true;

    if (!accountInfo || !accountInfo.address || !loggedIn) return;
    if (hasMoreAddressMappings) {
      fetchMoreLists(accountInfo?.address ?? '', listsTab);
    }
  }, [accountInfo, fetchMoreLists, listsTab, loggedIn]);


  useEffect(() => {
    const listsView = getAccountAddressMappingsView(accountInfo, listsTab);
    const createdBys = listsView.map((addressMapping) => addressMapping.createdBy);
    fetchAccounts([...new Set(createdBys)]);
  }, [accountInfo, listsTab]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;

      await fetchAccounts([addressOrUsername as string]);
    }
    getPortfolioInfo();
  }, [addressOrUsername]);



  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect and sign in to view this page.'}
      node={!accountInfo ? <></> :
        <div style={{ minHeight: '100vh' }}>
          <br />

          <div className='flex-center flex-wrap'>
            <InfiniteScroll
              dataLength={listsView.length}
              next={async () => {
                fetchMoreLists(accountInfo?.address ?? '', listsTab)
              }}
              hasMore={hasMoreAddressMappings}
              loader={<div>
                <br />
                <Spin size={'large'} />
              </div>}
              scrollThreshold={"300px"}
              endMessage={
                <></>
              }
              initialScrollY={0}
              style={{ width: '100%', overflow: 'hidden' }}
            >
              <div className='full-width flex-center flex-wrap'>
                {listsView.map((addressMapping, idx) => {
                  return <AddressListCard
                    key={idx}
                    addressMapping={addressMapping}
                    addressOrUsername={accountInfo.address}
                  />
                })}
              </div>
            </InfiniteScroll>

            {listsView.length === 0 && !hasMoreAddressMappings && (
              <Empty
                className='primary-text'
                description={
                  <span>
                    No private lists found. Public lists are found in your portfolio.
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </div>
      }

    />
  );
}

export default PrivateListsDisplay;