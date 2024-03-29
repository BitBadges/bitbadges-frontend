import { Menu, Spin, Typography } from 'antd';
import { BitBadgesUserInfo, GetSearchRouteSuccessResponse, getAbbreviatedAddress, isAddressValid } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { getSearchResults } from '../../bitbadges-api/api';

import { updateAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { updateCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BadgeAvatar } from '../badges/BadgeAvatar';

export function SearchDropdown({
  searchValue,
  onSearch,
  onlyAddresses,
  onlyCollections,
  onlyLists,
  allowMintSearch,
  specificCollectionId
}: {
  searchValue: string;
  onSearch: (value: string, isAccount?: boolean, isCollection?: boolean, isBadge?: boolean) => Promise<void>;
  onlyAddresses?: boolean;
  onlyCollections?: boolean;
  onlyLists?: boolean;
  allowMintSearch?: boolean;
  specificCollectionId?: bigint;
}) {
  const [searchResponse, setSearchResponse] = useState<GetSearchRouteSuccessResponse<bigint>>();
  const [loading, setLoading] = useState<boolean>(false);

  const accountsResults = searchResponse?.accounts || [];
  const collectionsResults = searchResponse?.collections || [];
  const addressListsResults = searchResponse?.addressLists || [];
  const badgeResults = searchResponse?.badges || [];
  const mintAccount = useAccount('Mint');

  const DELAY_MS = 500;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: search dropdown, search value changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!searchValue) return;

      setLoading(true);
      setSearchResponse(undefined);

      const result = await getSearchResults(searchValue, {
        noCollections: onlyAddresses || onlyLists,
        noAccounts: onlyCollections || onlyLists,
        noAddressLists: onlyAddresses || onlyCollections,
        noBadges: onlyAddresses || onlyLists,
        specificCollectionId
      });

      if (specificCollectionId) {
        //It returns the requested collection but we just want to display the badges
        result.collections = [];
      }

      if (searchValue === 'Mint' && allowMintSearch && mintAccount) {
        if (!result.accounts.find((a) => a.address === 'Mint')) {
          result.accounts.unshift(mintAccount.clone());
        } else {
          //bring to front
          result.accounts = result.accounts.filter((a) => a.address !== 'Mint');
          result.accounts.unshift(mintAccount.clone());
        }
      } else if (!allowMintSearch) {
        result.accounts = result.accounts.filter((a) => a.address !== 'Mint');
      }

      if (onlyLists) {
        for (const account of result.accounts) {
          account.addressLists = [...account.addressLists, ...result.addressLists];
        }
      }

      //Update context if we have new accounts or collections
      updateAccounts(result.accounts);

      for (const collection of result.collections) {
        updateCollection(collection);
      }

      for (const badge of result.badges) {
        updateCollection(badge.collection);
      }

      setSearchResponse(result);
      setLoading(false);
    }, DELAY_MS);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [searchValue, allowMintSearch, mintAccount, onlyLists, onlyAddresses, onlyCollections, specificCollectionId]);

  //We have three sections of the dropdown:
  //1. Attempt to map the current text to an address or name (hide if duplicate in accounts results)
  //2. Search results for accounts
  //3. Search results for collections

  return (
    <Menu
      className="dropdown card-bg rounded-lg"
      onKeyDown={async (e) => {
        if (e.key === '') {
          await onSearch(searchValue);
        }
      }}
      theme="dark"
      style={{ border: '1px solid gray', marginTop: 8, overflow: 'hidden' }}>
      {
        <>
          {!onlyCollections && !onlyLists && (
            <>
              <Typography.Text className="primary-text" strong style={{ fontSize: 20 }}>
                Accounts
              </Typography.Text>
              <div className="primary-text inherit-bg" style={{ overflowY: 'auto', maxHeight: 250 }}>
                {/* Current Search Value Address Helper - Matches Text Exactly */}
                {!accountsResults.find(
                  (result: BitBadgesUserInfo<bigint>) =>
                    result.address === searchValue || result.cosmosAddress === searchValue || result.username === searchValue
                ) && (
                  <Menu.Item
                    className={isAddressValid(searchValue) && searchValue !== 'Mint' ? 'dropdown-item' : 'dropdown-item-disabled'}
                    disabled={!loading && isAddressValid(searchValue) && searchValue !== 'Mint'}
                    onClick={async () => {
                      await onSearch(searchValue, true, false);
                    }}>
                    <div className="flex-between">
                      <div className="flex-center" style={{ alignItems: 'center' }}>
                        <AddressDisplay addressOrUsername={searchValue} hidePortfolioLink hideTooltip />
                      </div>
                    </div>
                  </Menu.Item>
                )}

                {/* {Account Results} */}
                {accountsResults.map((result: BitBadgesUserInfo<bigint>, idx) => {
                  return (
                    <Menu.Item
                      key={idx}
                      className="dropdown-item"
                      onClick={async () => {
                        await onSearch(result.address, true, false);
                      }}>
                      <div className="flex-between">
                        <div className="flex-center" style={{ alignItems: 'center' }}>
                          <AddressDisplay addressOrUsername={result.address} hidePortfolioLink hideTooltip />
                        </div>
                      </div>
                    </Menu.Item>
                  );
                })}
              </div>
            </>
          )}
          {loading && (
            <Menu.Item className="dropdown-item" disabled style={{ cursor: 'disabled' }}>
              <Spin size={'large'} />
            </Menu.Item>
          )}

          {/* Collection Results */}
          {!onlyAddresses && !onlyLists && !specificCollectionId && (
            <>
              <Typography.Text className="primary-text" strong style={{ fontSize: 20 }}>
                Collections
              </Typography.Text>
              <div className="primary-text inherit-bg" style={{ overflowY: 'auto', maxHeight: 250 }}>
                {collectionsResults.length === 0 && (
                  <Menu.Item disabled style={{ cursor: 'disabled' }}>
                    <div className="primary-text">None</div>
                  </Menu.Item>
                )}
                {collectionsResults.map((result) => {
                  return (
                    <Menu.Item
                      key={'' + result.collectionId}
                      className="dropdown-item primary-text"
                      onClick={() => {
                        onSearch(`${result.collectionId}`, false, true);
                      }}>
                      <div className="flex-between primary-text">
                        <div className="flex-center" style={{ alignItems: 'center' }}>
                          <BadgeAvatar size={35} collectionId={result.collectionId} />
                          {result.cachedCollectionMetadata?.name}
                        </div>
                        <div className="flex-center" style={{ alignItems: 'center' }}>
                          ID: {`${result.collectionId}`}
                        </div>
                      </div>
                    </Menu.Item>
                  );
                })}
              </div>
            </>
          )}

          {!onlyAddresses && !onlyLists && (
            <>
              <Typography.Text className="primary-text" strong style={{ fontSize: 20 }}>
                Badges
              </Typography.Text>
              <div className="primary-text inherit-bg" style={{ overflowY: 'auto', maxHeight: 250 }}>
                {badgeResults.length === 0 && (
                  <Menu.Item disabled style={{ cursor: 'disabled' }}>
                    <div className="primary-text">None</div>
                  </Menu.Item>
                )}
                {badgeResults.map((result) => {
                  const collection = result.collection;
                  const badgeIds = result.badgeIds;

                  return (
                    <>
                      {badgeIds.map((idRange) => {
                        const ids = [];
                        for (let i = 0n; i <= 3n; i++) {
                          if (idRange.start + i > idRange.end) break;
                          ids.push(idRange.start + i);
                        }

                        const hasMoreThanThree = idRange.end - idRange.start > 3n;
                        return (
                          <>
                            {ids.map((id, idx) => {
                              const metadata = collection.getBadgeMetadata(id);

                              return (
                                <Menu.Item
                                  key={'' + collection.collectionId + ' ' + id + idx}
                                  className="dropdown-item"
                                  onClick={() => {
                                    onSearch(`${collection.collectionId}/${id}`, false, false, true);
                                  }}>
                                  <div className="flex-between primary-text">
                                    <div className="flex-center" style={{ alignItems: 'center' }}>
                                      <BadgeAvatar size={35} collectionId={collection.collectionId} badgeId={id} />
                                      {metadata?.name}
                                    </div>
                                    <div className="flex-center" style={{ alignItems: 'center', textAlign: 'right' }}>
                                      Collection ID: {`${collection.collectionId}`}
                                      <br />
                                      Badge ID: {`${id}`}
                                    </div>
                                  </div>
                                </Menu.Item>
                              );
                            })}
                            {hasMoreThanThree && (
                              <>
                                This collection (ID {collection.collectionId.toString()}) has {(idRange.end - idRange.start - 3n).toString()} more
                                badges that match the search criteria...
                                <hr color="grey" />
                              </>
                            )}
                          </>
                        );
                      })}
                    </>
                  );
                })}
              </div>
            </>
          )}

          {!onlyAddresses && !onlyCollections && (
            <>
              <Typography.Text className="primary-text" strong style={{ fontSize: 20 }}>
                Lists
              </Typography.Text>
              <div className="primary-text inherit-bg" style={{ overflowY: 'auto', maxHeight: 250 }}>
                {addressListsResults.length === 0 && (
                  <Menu.Item disabled style={{ cursor: 'disabled' }}>
                    <div className="primary-text">None</div>
                  </Menu.Item>
                )}
                {addressListsResults.map((result) => {
                  const listId = result.listId.includes('_') ? result.listId.split('_')[1] : result.listId;
                  const isOffChain = result.listId.includes('_');

                  return (
                    <Menu.Item
                      key={'' + result.listId}
                      className="dropdown-item"
                      onClick={() => {
                        onSearch(`${result.listId}`, false, false);
                      }}>
                      <div className="flex-between primary-text">
                        <div className="flex-center" style={{ alignItems: 'center' }}>
                          <BadgeAvatar size={35} collectionId={0n} metadataOverride={result.metadata} />
                          {result.metadata?.name}
                        </div>
                        <div className="flex-center" style={{ alignItems: 'center', textAlign: 'right' }}>
                          ID: {`${getAbbreviatedAddress(listId)}`} {isOffChain && '(Off-Chain)'}
                        </div>
                      </div>
                    </Menu.Item>
                  );
                })}
              </div>
            </>
          )}
        </>
      }
    </Menu>
  );
}
