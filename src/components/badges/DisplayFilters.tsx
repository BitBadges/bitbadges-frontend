import { CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag, Tooltip, Typography } from 'antd';
import { BatchBadgeDetails, BatchBadgeDetailsArray, UintRangeArray } from 'bitbadgesjs-sdk';
import { getAddressLists } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { SelectWithOptions } from '../inputs/Selects';
import { SearchDropdown } from '../navigation/SearchDropdown';
import { BadgeAvatar } from './BadgeAvatar';

export const AccountFilterSearchBar = ({
  searchValue,
  setSearchValue,
  onSearch
}: {
  searchValue: string;
  setSearchValue: (searchValue: string) => void;
  onSearch: (searchValue: any, isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => Promise<void>;
}) => {
  const SearchBar = (
    <Input
      defaultValue=""
      placeholder="Search an account"
      value={searchValue}
      onChange={async (e) => {
        setSearchValue(e.target.value);
      }}
      className="form-input rounded-lg p-1 px-2"
      //styled-button-normal rounded-lg p-1 focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer
      style={{ height: 38 }}
    />
  );

  const FilterSearchDropdown = (
    <Dropdown
      open={searchValue !== ''}
      placement="bottom"
      overlay={<SearchDropdown onlyAddresses onSearch={onSearch} searchValue={searchValue} />}
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={['hover', 'click']}>
      {SearchBar}
    </Dropdown>
  );

  return FilterSearchDropdown;
};

export const ListFilterSearchBar = ({
  searchValue,
  setSearchValue,
  onSearch
}: {
  searchValue: string;
  setSearchValue: (searchValue: string) => void;
  onSearch: (searchValue: any, isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => Promise<void>;
}) => {
  const SearchBar = (
    <Input
      defaultValue=""
      placeholder="Filter by searching a list"
      value={searchValue}
      onChange={async (e) => {
        setSearchValue(e.target.value);
      }}
      className="form-input rounded-lg p-1 px-2"
      //styled-button-normal rounded-lg p-1 focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer
      style={{ height: 38 }}
    />
  );

  const FilterSearchDropdown = (
    <Dropdown
      open={searchValue !== ''}
      placement="bottom"
      overlay={<SearchDropdown onlyLists onSearch={onSearch} searchValue={searchValue} />}
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={['hover', 'click']}>
      {SearchBar}
    </Dropdown>
  );

  return FilterSearchDropdown;
};

export const CollectionsFilterSearchBar = ({
  specificCollectionId,
  searchValue,
  setSearchValue,
  onSearch
}: {
  specificCollectionId?: bigint;
  searchValue: string;
  setSearchValue: (searchValue: string) => void;
  onSearch: (searchValue: any, isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => Promise<void>;
}) => {
  const SearchBar = (
    <Input
      defaultValue=""
      placeholder={specificCollectionId ? 'Filter by name or ID' : 'Filter by name or ID'}
      value={searchValue}
      onChange={async (e) => {
        setSearchValue(e.target.value);
      }}
      className="form-input rounded-lg p-1 px-2"
      style={{ height: 38 }}
    />
  );

  const FilterSearchDropdown = (
    <Dropdown
      open={searchValue !== ''}
      placement="bottom"
      overlay={<SearchDropdown onlyCollections onSearch={onSearch} searchValue={searchValue} specificCollectionId={specificCollectionId} />}
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={['hover', 'click']}>
      {SearchBar}
    </Dropdown>
  );

  return FilterSearchDropdown;
};

export const AccountDetailsTag = ({ addressOrUsername, onClose }: { addressOrUsername: string; onClose?: () => void }) => {
  const accountInfo = useAccount(addressOrUsername);

  if (!accountInfo) return <></>;

  return (
    <Tag
      className="primary-text inherit-bg flex-between"
      style={{ alignItems: 'center', marginBottom: 8 }}
      closable
      closeIcon={
        onClose ? (
          <CloseCircleOutlined
            className="primary-text styled-button-normal flex-center"
            style={{
              border: 'none',
              fontSize: 16,
              alignContent: 'center',
              marginLeft: 5
            }}
            size={100}
          />
        ) : (
          <></>
        )
      }
      onClose={onClose}>
      <div className="primary-text inherit-bg" style={{ alignItems: 'center', marginRight: 4, maxWidth: 280 }}>
        <div className="flex-center" style={{ alignItems: 'center', maxWidth: 280, minHeight: 50 }}>
          <AddressDisplay addressOrUsername={addressOrUsername} />
        </div>
      </div>
    </Tag>
  );
};

export const BatchBadgeDetailsTag = ({ badgeIdObj, onClose }: { badgeIdObj: BatchBadgeDetails<bigint>; onClose?: () => void }) => {
  const collection = useCollection(badgeIdObj.collectionId);
  const metadata = badgeIdObj.badgeIds.isFull()
    ? collection?.cachedCollectionMetadata
    : collection?.getBadgeMetadata(badgeIdObj.badgeIds[0].start) ?? undefined;

  return (
    <Tag
      className="primary-text inherit-bg flex-between"
      style={{ alignItems: 'center', marginBottom: 8 }}
      closable
      closeIcon={
        onClose ? (
          <CloseCircleOutlined
            className="primary-text styled-button-normal flex-center"
            style={{
              border: 'none',
              fontSize: 16,
              alignContent: 'center',
              marginLeft: 5
            }}
            size={100}
          />
        ) : (
          <></>
        )
      }
      onClose={onClose}>
      <div className="primary-text inherit-bg" style={{ alignItems: 'center', marginRight: 4, maxWidth: 280 }}>
        <div className="flex-center" style={{ alignItems: 'center', maxWidth: 280 }}>
          <div>
            <BadgeAvatar size={30} noHover collectionId={badgeIdObj.collectionId} metadataOverride={metadata} />
          </div>
          <Typography.Text
            className="primary-text"
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              margin: 4,
              overflowWrap: 'break-word'
            }}>
            <Tooltip
              title={`Collection ID: ${badgeIdObj.collectionId}\n\n${badgeIdObj.badgeIds.isFull() ? 'All' : `Badge IDs: ${badgeIdObj.badgeIds.map((x) => (x.start === x.end ? `${x.start}` : `${x.start}-${x.end}`)).join(', ')}`}`}>
              <div>{metadata?.name}</div>
            </Tooltip>
            <div style={{ fontSize: 12 }} className="secondary-text">
              Collection ID: {badgeIdObj.collectionId.toString()}
              <br />
              {badgeIdObj.badgeIds.isFull()
                ? 'All'
                : `Badge IDs: ${badgeIdObj.badgeIds.map((x) => (x.start === x.end ? `${x.start}` : `${x.start}-${x.end}`)).join(', ')}`}
            </div>
          </Typography.Text>
        </div>
      </div>
      <br />
    </Tag>
  );
};

export const OptionsSelects = ({
  editMode,
  setEditMode,
  cardView,
  setCardView,
  groupByCollection,
  setGroupByCollection,
  addressOrUsername,
  isListsSelect,
  searchValue,
  setSearchValue,
  onlySpecificCollections,
  setOnlySpecificCollections,
  onlySpecificLists,
  setOnlyFilteredLists,
  oldestFirst,
  setOldestFirst
}: {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  cardView: boolean;
  setCardView: (cardView: boolean) => void;
  groupByCollection: boolean;
  setGroupByCollection: (groupByCollection: boolean) => void;
  addressOrUsername: string;
  isListsSelect?: boolean;
  searchValue: string;
  setSearchValue: (searchValue: string) => void;
  onlySpecificCollections: BatchBadgeDetailsArray<bigint>;
  setOnlySpecificCollections: (onlySpecificCollections: BatchBadgeDetailsArray<bigint>) => void;
  onlySpecificLists: string[];
  setOnlyFilteredLists: (onlySpecificLists: string[]) => void;
  oldestFirst: boolean;
  setOldestFirst: (oldestFirst: boolean) => void;
}) => {
  const chain = useChainContext();
  const accountInfo = useAccount(addressOrUsername);

  if (!accountInfo) return <></>;

  const CustomizeSelect = (
    <>
      {chain.address === accountInfo.address && chain.loggedIn && (
        <>
          <SelectWithOptions
            type="button"
            selected={editMode}
            title=""
            value={editMode ? 'edit' : 'none'}
            setValue={(e) => {
              setEditMode(e === 'edit');
              setCardView(true);
            }}
            options={[
              {
                label: (
                  <Tooltip title="Customize your profile">
                    <EditOutlined />
                  </Tooltip>
                ),
                value: 'none'
              },
              {
                label: (
                  <Tooltip title="Close customize mode">
                    <EditOutlined />
                  </Tooltip>
                ),
                value: 'edit',
                disabledReason: !chain.loggedIn ? 'Please sign in to go into customize mode' : undefined,
                disabled: !chain.loggedIn
              }
            ]}
          />
        </>
      )}
    </>
  );

  const FilterSearchDropdown = (
    <CollectionsFilterSearchBar
      onSearch={async (searchValue: any, _isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
        if (typeof searchValue === 'string') {
          if (isCollection) {
            setOnlySpecificCollections(
              BatchBadgeDetailsArray.From([...onlySpecificCollections, { collectionId: BigInt(searchValue), badgeIds: UintRangeArray.FullRanges() }])
            );
          } else if (isBadge) {
            const collectionId = BigInt(searchValue.split('/')[0]);
            const badgeId = BigInt(searchValue.split('/')[1]);
            setOnlySpecificCollections(
              BatchBadgeDetailsArray.From([
                ...onlySpecificCollections,
                { collectionId, badgeIds: UintRangeArray.From([{ start: badgeId, end: badgeId }]) }
              ])
            );
          }

          setSearchValue('');
        }
      }}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
    />
  );

  const ListSearchDropdown = (
    <ListFilterSearchBar
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      onSearch={async (searchValue: any) => {
        if (typeof searchValue === 'string') {
          setOnlyFilteredLists([...onlySpecificLists, searchValue]);
          setSearchValue('');
          //TODO: Roundabout way without context
          const listRes = await getAddressLists({
            listsToFetch: [{ listId: searchValue }]
          });

          const newAccountInfo = accountInfo.clone();
          newAccountInfo.addressLists.push(...listRes.addressLists);
          updateAccount(newAccountInfo);
        }
      }}
    />
  );
  return (
    <>
      <div className="flex-wrap full-width flex" style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', marginTop: 12 }}>
        {CustomizeSelect}

        {!isListsSelect && (
          <SelectWithOptions
            title="Group By"
            value={groupByCollection ? 'collection' : 'none'}
            setValue={(e) => {
              setGroupByCollection(e === 'collection');
            }}
            options={[
              { label: 'None', value: 'none' },
              { label: 'Collection', value: 'collection' }
            ]}
          />
        )}

        {
          <SelectWithOptions
            title="Sort By"
            value={oldestFirst ? 'oldest' : 'newest'}
            setValue={(e) => {
              setOldestFirst(e === 'oldest');
            }}
            options={[
              { label: 'Newest', value: 'newest' },
              { label: 'Oldest', value: 'oldest' }
            ]}
          />
        }

        {!editMode && !isListsSelect && (
          <SelectWithOptions
            title="View"
            value={cardView ? 'card' : 'image'}
            setValue={(e) => {
              setCardView(e === 'card');
            }}
            options={[
              { label: 'Card', value: 'card' },
              { label: 'Image', value: 'image' }
            ]}
          />
        )}

        {
          <div style={{ marginBottom: 4, flexGrow: 1 }}>
            {' '}
            {!isListsSelect && FilterSearchDropdown}
            {isListsSelect && ListSearchDropdown}
          </div>
        }
      </div>
    </>
  );
};
