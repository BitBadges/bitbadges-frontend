
import { Avatar, Menu, Spin, Typography } from 'antd';
import { AccountDocument, BitBadgesUserInfo, MetadataDocument, SupportedChain, convertToBitBadgesUserInfo, convertToCosmosAddress, isAddressValid } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getSearchResults } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { AddressDisplay } from '../address/AddressDisplay';

export function SearchDropdown({
  searchValue,
  onSearch,
  onlyAddresses
}: {
  searchValue: string,
  onSearch: (value: string) => void
  onlyAddresses?: boolean
}) {
  const { setAccounts, cosmosAddressesByAccountNames, accounts } = useAccountsContext();
  const [accountsResults, setAccountsResults] = useState<BitBadgesUserInfo[]>([]);
  const [collectionsResults, setCollectionsResults] = useState<(MetadataDocument & {
    _id: string;
    _rev: string;
  })[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const DELAY_MS = 500;
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchValue) return

      setLoading(true);
      setAccountsResults([]);
      setCollectionsResults([]);
      const results = await getSearchResults(searchValue);
      setAccounts(results.accounts);

      const accountsToSet = [];
      accountsToSet.push(...results.accounts.map((result: AccountDocument) => convertToBitBadgesUserInfo(result)));
      setAccountsResults(accountsToSet);
      setCollectionsResults(results.collections);
      setLoading(false);
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [searchValue, setAccounts])


  //We have three sections of the dropdown:
  //1. Attempt to map the current text to an address or name (hide if duplicate in accounts results)
  //2. Search results for accounts
  //3. Search results for collections

  return <Menu className='dropdown' onKeyDown={(e) => {
    if (e.key === '') {
      onSearch(searchValue);
    }
  }}>

    <Typography.Text strong style={{ fontSize: 20 }}>Accounts</Typography.Text>

    {/* Current Search Value Address Helper - Matches Text Exactly */}
    {!accountsResults.find((result: BitBadgesUserInfo) => result.address === searchValue || result.name === searchValue) &&
      <Menu.Item className='dropdown-item' disabled={!cosmosAddressesByAccountNames[searchValue] && !isAddressValid(searchValue)} style={{ cursor: 'disabled' }} onClick={() => {
        cosmosAddressesByAccountNames[searchValue] ?
          onSearch(cosmosAddressesByAccountNames[searchValue]) :
          onSearch(searchValue);
      }}>
        <div className='flex-between'>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AddressDisplay
              userInfo={cosmosAddressesByAccountNames[searchValue] ?
                accounts[cosmosAddressesByAccountNames[searchValue]] :
                {
                  address: searchValue,
                  cosmosAddress: convertToCosmosAddress(searchValue),
                  chain: SupportedChain.UNKNOWN,
                  accountNumber: -1,
                }}
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
    {accountsResults.map((result: BitBadgesUserInfo, idx) => {
      return <Menu.Item key={idx} className='dropdown-item' onClick={() => {
        onSearch(result.address);
      }}>
        <div className='flex-between'>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AddressDisplay
              userInfo={result}
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
      {collectionsResults.map((result, idx) => {
        return <Menu.Item key={'collection' + idx + result._id} className='dropdown-item' onClick={() => {
          onSearch(`${result._id.split(':')[0]}`);
        }}>
          <div className='flex-between'>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={result.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} style={{ marginRight: 8 }} />
              {result.metadata.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              ID: {result._id.split(':')[0]}
            </div>
          </div>
        </Menu.Item>
      })}
    </>}
  </Menu>
}
