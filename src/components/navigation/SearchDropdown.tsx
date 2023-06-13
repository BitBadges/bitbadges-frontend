
import { Avatar, Menu, Spin, Typography } from 'antd';
import { BitBadgesUserInfo, GetSearchRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useEffect, useRef, useState } from 'react';
import { getSearchResults } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';

export function SearchDropdown({
  searchValue,
  onSearch,
  onlyAddresses
}: {
  searchValue: string,
  onSearch: (value: string, isAccount?: boolean) => Promise<void>
  onlyAddresses?: boolean
}) {
  const accounts = useAccountsContext();
  const accountsRef = useRef(accounts);

  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);

  const [searchResponse, setSearchResponse] = useState<GetSearchRouteSuccessResponse<bigint>>();
  const [loading, setLoading] = useState<boolean>(false);

  const accountsResults = searchResponse?.accounts || [];
  const collectionsResults = searchResponse?.collections || [];

  const DELAY_MS = 500;
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchValue) return

      setLoading(true);
      setSearchResponse(undefined);
      const result = await getSearchResults(searchValue);

      //Update context if we have new accounts or collections
      for (const account of result.accounts) {
        accountsRef.current.updateAccount(account);
      }

      for (const collection of result.collections) {
        collectionsRef.current.updateCollection(collection);
      }

      setSearchResponse(result);
      setLoading(false);
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [searchValue])


  //We have three sections of the dropdown:
  //1. Attempt to map the current text to an address or name (hide if duplicate in accounts results)
  //2. Search results for accounts
  //3. Search results for collections

  return <Menu className='dropdown' onKeyDown={async (e) => {
    if (e.key === '') {
      await onSearch(searchValue);
    }
  }}>

    <Typography.Text strong style={{ fontSize: 20 }}>Accounts</Typography.Text>

    {/* Current Search Value Address Helper - Matches Text Exactly */}
    {!accountsResults.find((result: BitBadgesUserInfo<bigint>) => result.address === searchValue || result.cosmosAddress === searchValue || result.username === searchValue) &&
      <Menu.Item className='dropdown-item' disabled={!accounts.getAccount(searchValue)} style={{ cursor: 'disabled' }} onClick={async () => {
        await onSearch(searchValue, true);
      }}>
        <div className='flex-between'>
          <div className='flex-center' style={{ alignItems: 'center' }}>
            <AddressDisplay
              addressOrUsername={searchValue}
              hidePortfolioLink
              hideTooltip
            />
          </div>
        </div>
      </Menu.Item>
    }

    {loading && <Menu.Item className='dropdown-item' disabled style={{ cursor: 'disabled' }}>
      <Spin size={'large'} />
    </Menu.Item>}

    {/* {Account Results} */}
    {accountsResults.map((result: BitBadgesUserInfo<bigint>, idx) => {
      return <Menu.Item key={idx} className='dropdown-item' onClick={async () => {
        await onSearch(result.address, true);
      }}>
        <div className='flex-between'>
          <div className='flex-center' style={{ alignItems: 'center' }}>
            <AddressDisplay
              addressOrUsername={result.address}
              hidePortfolioLink
              hideTooltip
            />
          </div>
        </div>
      </Menu.Item>
    })}

    {/* Collection Results */}
    {!onlyAddresses && collectionsResults.length > 0 && <>
      <hr />
      <Typography.Text strong style={{ fontSize: 20 }}>Collections</Typography.Text>
      {collectionsResults.map((result,) => {
        return <Menu.Item key={'' + result.collectionId} className='dropdown-item' onClick={() => {
          onSearch(`${result.collectionId}`, false);
        }}>
          <div className='flex-between'>
            <div className='flex-center' style={{ alignItems: 'center' }}>
              <Avatar src={result.collectionMetadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} style={{ marginRight: 8 }} />
              {result.collectionMetadata?.name}
            </div>
            <div className='flex-center' style={{ alignItems: 'center' }}>
              ID: {`${result.collectionId}`}
            </div>
          </div>
        </Menu.Item>
      })}
    </>}
  </Menu>
}
