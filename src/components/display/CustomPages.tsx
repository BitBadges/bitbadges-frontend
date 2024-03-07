import { Col, Dropdown, Input, Switch } from 'antd';
import { BatchBadgeDetails, BatchBadgeDetailsArray, BitBadgesAddressList, UintRangeArray } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { getAddressLists } from '../../bitbadges-api/api';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressListCard } from '../badges/AddressListCard';
import { BatchBadgeDetailsTag } from '../badges/DisplayFilters';
import { SearchDropdown } from '../navigation/SearchDropdown';
import { GenericTextAreaFormInput, GenericTextFormInput } from '../tx-timelines/form-items/MetadataForm';
import { InformationDisplayCard } from './InformationDisplayCard';

export const NewPageInputForm = ({
  visible,
  setVisible,
  onAddPage
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onAddPage: (newPageTitle: string, newPageDescription: string) => Promise<void>;
}) => {
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageDescription, setNewPageDescription] = useState('');

  return (
    <>
      {visible && (
        <div className="flex-center ">
          <Col md={12} xs={24} style={{ marginBottom: 8 }}>
            <GenericTextFormInput required label="Name" value={newPageTitle} setValue={setNewPageTitle} placeholder="Title of your page" />
            <br />
            <br />
            <GenericTextAreaFormInput
              label="Description"
              value={newPageDescription}
              setValue={setNewPageDescription}
              placeholder="Give a brief description of your page."
            />
            <br />
            <br />
            <div className="flex-center full-width">
              <button
                className="landing-button"
                style={{ width: '100%' }}
                onClick={async () => {
                  await onAddPage(newPageTitle, newPageDescription);

                  setVisible(false);
                  setNewPageDescription('');
                  setNewPageTitle('');
                }}>
                Add Page
              </button>
            </div>
          </Col>
        </div>
      )}
    </>
  );
};

export const CustomizeAddRemoveListFromPage = ({
  addressOrUsername,
  onAdd,
  onRemove,
  currItems,
  span,
  showIncludeExclude
}: {
  addressOrUsername: string;
  onAdd: (listId: string, onList?: boolean) => Promise<void>;
  onRemove: (listId: string) => Promise<void>;
  currItems: string[];
  showIncludeExclude?: boolean;
  span?: number;
}) => {
  const accountInfo = useAccount(addressOrUsername);

  const [customizeSearchListValue, setCustomizeSearchListValue] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [selectedListList, setSelectedListList] = useState<BitBadgesAddressList<bigint> | null>(null);

  const [onList, setOnList] = useState<boolean>(true);

  useEffect(() => {
    if (!selectedList) return;
    async function fetchAddressList() {
      const listRes = await getAddressLists({
        listsToFetch: [{ listId: selectedList }]
      });
      if (listRes.addressLists.length > 0) {
        setSelectedListList(listRes.addressLists[0]);
      }
    }

    fetchAddressList();
  }, [selectedList]);

  const CustomizeListSearchBar = (
    <Input
      defaultValue=""
      placeholder={'Add or remove by searching a list'}
      value={customizeSearchListValue}
      onChange={async (e) => {
        setCustomizeSearchListValue(e.target.value);
      }}
      className="form-input"
    />
  );

  const CustomizeSearchListDropdown = (
    <Dropdown
      open={customizeSearchListValue !== ''}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyLists
          onSearch={async (searchValue: any, isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
            if (!isAccount && !isCollection && !isBadge && typeof searchValue === 'string') {
              setSelectedList(searchValue);
              setCustomizeSearchListValue('');
            }
          }}
          searchValue={customizeSearchListValue}
        />
      }
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={['hover', 'click']}>
      {CustomizeListSearchBar}
    </Dropdown>
  );

  const added = selectedList ? currItems?.includes(selectedList) : false;

  if (!accountInfo) return <></>;

  return (
    <InformationDisplayCard md={span ?? 8} xs={span ?? 24} style={{ marginBottom: 8 }} noBorder inheritBg>
      <div className="flex">{CustomizeSearchListDropdown}</div>

      {selectedList && selectedListList && (
        <>
          <br />
          <div className="flex-center">
            <AddressListCard addressList={selectedListList} addressOrUsername={accountInfo.address} hideInclusionDisplay />
          </div>
          <br />
        </>
      )}
      {selectedList && showIncludeExclude && !added && (
        <>
          <Switch
            checkedChildren="Must Be On List"
            unCheckedChildren="Must Be Off List"
            checked={onList}
            onChange={(checked) => {
              setOnList(checked);
            }}
          />
          <br />
          <br />
        </>
      )}

      {selectedList && (
        <div className="flex-center flex-wrap">
          {!added && (
            <button
              className="landing-button"
              onClick={async () => {
                if (!selectedList) return;

                await onAdd(selectedList, onList);

                setSelectedList('');
              }}>
              Add
            </button>
          )}

          {added && (
            <button
              className="landing-button"
              onClick={async () => {
                if (!selectedList) return;

                await onRemove(selectedList);

                setSelectedList('');
              }}>
              Remove
            </button>
          )}
        </div>
      )}
    </InformationDisplayCard>
  );
};

export const allInBatchArray = (arr: BatchBadgeDetailsArray<bigint>, badgeIdObj: BatchBadgeDetails<bigint>) => {
  return BatchBadgeDetailsArray.From(badgeIdObj).every((x) => x.isSubsetOf(arr));
};

export const noneInBatchArray = (arr: BatchBadgeDetailsArray<bigint>, badgeIdObj: BatchBadgeDetails<bigint>) => {
  return badgeIdObj.noneIn(arr);
};

export const CustomizeAddRemoveBadgeFromPage = ({
  onAdd,
  onRemove,
  currItems
}: {
  onAdd: (badgeIdObj: BatchBadgeDetails<bigint>) => Promise<void>;
  onRemove: (badgeIdObj: BatchBadgeDetails<bigint>) => Promise<void>;
  currItems: BatchBadgeDetailsArray<bigint>;
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BatchBadgeDetails<bigint> | null>(null);
  const [customizeSearchValue, setCustomizeSearchValue] = useState<string>('');

  const CustomizeSearchBar = (
    <Input
      defaultValue=""
      placeholder={'Add or remove by searching a collection or badge'}
      value={customizeSearchValue}
      onChange={async (e) => {
        setCustomizeSearchValue(e.target.value);
      }}
      className="form-input"
    />
  );

  const CustomizeSearchDropdown = (
    <Dropdown
      open={customizeSearchValue !== ''}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyCollections
          onSearch={async (searchValue: any, _isAccount?: boolean | undefined, isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
            if (typeof searchValue === 'string') {
              if (isCollection) {
                setSelectedBadge(
                  new BatchBadgeDetails({
                    collectionId: BigInt(searchValue),
                    badgeIds: UintRangeArray.FullRanges()
                  })
                );
              } else if (isBadge) {
                const collectionId = BigInt(searchValue.split('/')[0]);
                const badgeId = BigInt(searchValue.split('/')[1]);

                setSelectedBadge(
                  new BatchBadgeDetails({
                    collectionId,
                    badgeIds: [{ start: badgeId, end: badgeId }]
                  })
                );
              }

              setCustomizeSearchValue('');
            }
          }}
          searchValue={customizeSearchValue}
        />
      }
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={['hover', 'click']}>
      {CustomizeSearchBar}
    </Dropdown>
  );

  const allAreAdded = selectedBadge ? allInBatchArray(currItems, selectedBadge) : false;
  const noneAreAdded = selectedBadge ? noneInBatchArray(currItems, selectedBadge) : false;

  return (
    <InformationDisplayCard md={8} xs={24} style={{ marginBottom: 8 }} noBorder inheritBg noPadding>
      <div className="flex">{CustomizeSearchDropdown}</div>
      {selectedBadge && (
        <>
          <br />
          <div className="flex-center">
            <BatchBadgeDetailsTag
              badgeIdObj={selectedBadge}
              onClose={() => {
                setSelectedBadge(null);
              }}
            />
          </div>
          <br />
        </>
      )}
      {selectedBadge && (
        <div className="flex-center flex-wrap">
          {!noneAreAdded && (
            <button
              className="landing-button"
              onClick={async () => {
                if (!selectedBadge) return;

                await onRemove(selectedBadge);

                setSelectedBadge(null);
              }}>
              Remove
            </button>
          )}

          {!allAreAdded && (
            <button
              className="landing-button"
              onClick={async () => {
                if (!selectedBadge) return;

                console.log('selectedBadge', selectedBadge);
                await onAdd(selectedBadge);

                setSelectedBadge(null);
              }}>
              Add
            </button>
          )}
        </div>
      )}{' '}
    </InformationDisplayCard>
  );
};
