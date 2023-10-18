
import { Avatar, Menu, Spin, Typography } from 'antd';
import { BitBadgesUserInfo, DefaultPlaceholderMetadata, GetSearchRouteSuccessResponse, getAbbreviatedAddress, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getSearchResults } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';

export function SearchDropdown({
  searchValue,
  onSearch,
  onlyAddresses,
  onlyCollections,
}: {
  searchValue: string,
  onSearch: (value: string | BitBadgesUserInfo<bigint>, isAccount?: boolean, isCollection?: boolean, isBadge?: boolean) => Promise<void>
  onlyAddresses?: boolean
  onlyCollections?: boolean
}) {
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();

  const [searchResponse, setSearchResponse] = useState<GetSearchRouteSuccessResponse<bigint>>();
  const [loading, setLoading] = useState<boolean>(false);

  const accountsResults = searchResponse?.accounts || [];
  const collectionsResults = searchResponse?.collections || [];
  const addressMappingsResults = searchResponse?.addressMappings || [];
  const badgeResults = searchResponse?.badges || [];

  const DELAY_MS = 250;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: search dropdown, search value changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!searchValue) return

      setLoading(true);
      setSearchResponse(undefined);


      const result = await getSearchResults(searchValue);
      console.log(result);
      //Update context if we have new accounts or collections
      accounts.updateAccounts(result.accounts);

      for (const collection of result.collections) {
        collections.updateCollection(collection);
      }

      for (const badge of result.badges) {
        collections.updateCollection(badge.collection);
      }

      setSearchResponse(result);
      setLoading(false);
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [searchValue]);


  //We have three sections of the dropdown:
  //1. Attempt to map the current text to an address or name (hide if duplicate in accounts results)
  //2. Search results for accounts
  //3. Search results for collections

  return <Menu className='dropdown gradient-bg' onKeyDown={async (e) => {
    if (e.key === '') {
      await onSearch(searchValue);
    }
  }} theme='dark' style={{ border: '1px solid gray', borderRadius: 8, marginTop: 8, overflow: 'hidden' }}>
    {loading ? <Menu.Item className='dropdown-item' disabled style={{ cursor: 'disabled' }}>
      <Spin size={'large'} />
    </Menu.Item> : <>
      {!onlyCollections && <>
        <Typography.Text className='primary-text' strong style={{ fontSize: 20 }}>Accounts</Typography.Text>
        <div className='primary-text inherit-bg' style={{ overflowY: 'auto', maxHeight: 250 }}>
          {/* Current Search Value Address Helper - Matches Text Exactly */}
          {!accountsResults.find((result: BitBadgesUserInfo<bigint>) => result.address === searchValue || result.cosmosAddress === searchValue || result.username === searchValue) &&
            <Menu.Item className='dropdown-item' disabled={true} style={{ cursor: 'disabled' }} onClick={async () => {
              await onSearch(searchValue, true);
            }}>
              <div className='flex-between'>
                <div className='flex-center' style={{ alignItems: 'center' }}>
                  <AddressDisplay
                    addressOrUsername={searchValue}
                    hidePortfolioLink
                    hideTooltip
                  // fontColor={'black'}
                  />
                </div>
              </div>
            </Menu.Item>
          }



          {/* {Account Results} */}
          {accountsResults.map((result: BitBadgesUserInfo<bigint>, idx) => {
            return <Menu.Item key={idx} className='dropdown-item' onClick={async () => {
              await onSearch(result, true, false);
            }}>
              <div className='flex-between'>
                <div className='flex-center' style={{ alignItems: 'center' }}>
                  <AddressDisplay
                    addressOrUsername={result.address}
                    hidePortfolioLink
                    hideTooltip
                  // fontColor={'black'}
                  />
                </div>
              </div>
            </Menu.Item>
          })}
        </div>
      </>}
      {/* Collection Results */}
      {
        !onlyAddresses && <>

          <Typography.Text className='primary-text' strong style={{ fontSize: 20 }}>Collections</Typography.Text>
          <div className='primary-text inherit-bg' style={{ overflowY: 'auto', maxHeight: 250 }}>
            {collectionsResults.length === 0 && <Menu.Item disabled style={{ cursor: 'disabled' }}>
              None
            </Menu.Item>}
            {collectionsResults.map((result,) => {
              return <Menu.Item key={'' + result.collectionId} className='dropdown-item' onClick={() => {
                onSearch(`${result.collectionId}`, false, true);
              }}>
                <div className='flex-between'>
                  <div className='flex-center' style={{ alignItems: 'center' }}>
                    <Avatar src={result.cachedCollectionMetadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') ?? DefaultPlaceholderMetadata.image} style={{ marginRight: 8 }} />
                    {result.cachedCollectionMetadata?.name}
                  </div>
                  <div className='flex-center' style={{ alignItems: 'center' }}>
                    ID: {`${result.collectionId}`}
                  </div>
                </div>
              </Menu.Item>
            })}
          </div>
        </>
      }

      {
        !onlyAddresses && <>
          <Typography.Text className='primary-text' strong style={{ fontSize: 20 }}>Badges</Typography.Text>
          <div className='primary-text inherit-bg' style={{ overflowY: 'auto', maxHeight: 250 }}>
            {badgeResults.length === 0 && <Menu.Item disabled style={{ cursor: 'disabled' }}>
              None
            </Menu.Item>}
            {badgeResults.map((result,) => {
              const collection = result.collection;
              const badgeIds = result.badgeIds;

              return <>
                {badgeIds.map((idRange) => {
                  const ids = [];
                  for (let i = 0n; i <= 3n; i++) {
                    if (idRange.start + i > idRange.end) break;
                    ids.push(idRange.start + i);
                  }

                  const hasMoreThanThree = idRange.end - idRange.start > 3n;


                  return <>

                    {ids.map((id, idx) => {
                      const metadata = getMetadataForBadgeId(id, collection.cachedBadgeMetadata);

                      return <Menu.Item key={'' + collection.collectionId + ' ' + id + idx} className='dropdown-item' onClick={() => {
                        onSearch(`${collection.collectionId}/${id}`, false, false, true);
                      }}>
                        <div className='flex-between'>
                          <div className='flex-center' style={{ alignItems: 'center' }}>
                            <Avatar src={metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') ?? DefaultPlaceholderMetadata.image} style={{ marginRight: 8 }} />
                            {metadata?.name}
                          </div>
                          <div className='flex-center' style={{ alignItems: 'center', textAlign: 'right' }}>
                            Collection ID: {`${collection.collectionId}`}
                            <br />
                            Badge ID: {`${id}`}
                          </div>
                        </div>
                      </Menu.Item>
                    })}
                    {hasMoreThanThree &&
                      <>This collection (ID {collection.collectionId.toString()}) has {(idRange.end - idRange.start - 3n).toString()} more badges that match the search criteria...
                        <hr color='grey' style={{}} />
                      </>
                    }
                  </>
                })}
              </>
            })}
          </div >
        </>
      }




      {
        !onlyAddresses && !onlyCollections && addressMappingsResults.length > 0 && <>

          <Typography.Text className='primary-text' strong style={{ fontSize: 20 }}>Lists</Typography.Text>
          <div className='primary-text inherit-bg' style={{ overflowY: 'auto', maxHeight: 250 }}>
            {addressMappingsResults.map((result,) => {
              const mappingId = result.mappingId.indexOf("_") >= 0 ? result.mappingId.split("_")[1] : result.mappingId;
              const isOffChain = result.mappingId.indexOf("_") >= 0;

              return <Menu.Item key={'' + result.mappingId} className='dropdown-item' onClick={() => {
                onSearch(`${result.mappingId}`, false, false);
              }}>
                <div className='flex-between'>
                  <div className='flex-center' style={{ alignItems: 'center' }}>
                    <Avatar src={result.metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') ?? DefaultPlaceholderMetadata.image} style={{ marginRight: 8 }} />
                    {result.metadata?.name}
                  </div>
                  <div className='flex-center' style={{ alignItems: 'center', textAlign: 'right' }}>
                    ID: {`${getAbbreviatedAddress(mappingId)}`} {isOffChain && '(Off-Chain)'}
                  </div>
                </div>
              </Menu.Item>
            })}
          </div>
        </>
      }
    </>}

  </Menu >
}
