import { Divider, Select } from 'antd';
import { useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { getUintRangesForAllBadgeIdsInCollection } from 'bitbadgesjs-utils';

import { UintRange } from 'bitbadgesjs-proto';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeInfiniteScroll, BatchBadgeDetailsTag, CollectionsFilterSearchBar } from '../../pages/account/[addressOrUsername]';
import { compareObjects } from '../../utils/compare';

export function BadgesTab({ collectionId }: {
  collectionId: bigint
}) {
  const [cardView, setCardView] = useState(true);
  const [filteredCollections, setFilteredCollections] = useState<{
    collectionId: bigint,
    badgeIds: UintRange<bigint>[]
  }[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const collection = useCollection(collectionId)

  const FilterSearchDropdown = <CollectionsFilterSearchBar
    specificCollectionId={collectionId}
  
  onSearch={async (searchValue: any, _isAccount?: boolean | undefined, _isCollection?: boolean | undefined, isBadge?: boolean | undefined) => {
    if (typeof searchValue === 'string') {
      if (isBadge) {
        const collectionId = BigInt(searchValue.split('/')[0]);
        const badgeId = BigInt(searchValue.split('/')[1]);

        setFilteredCollections([...filteredCollections, {
          collectionId,
          badgeIds: [{ start: badgeId, end: badgeId }]
        }]);
      }

      setSearchValue('');
    }
  }} searchValue={searchValue} setSearchValue={setSearchValue} />


  return (
    <div className='primary-text full-width'>
      <br />
      <div className='flex'>
        {FilterSearchDropdown}
        <div className='primary-text inherit-bg' style={{
          float: 'right',
          display: 'flex',
          alignItems: 'center',
          marginLeft: 16,
          marginRight: 16
        }}>
          View:

          <Select
            className="selector primary-text inherit-bg"
            value={cardView ? 'card' : 'image'}
            placeholder="Default: None"
            onChange={(e: any) => {
              setCardView(e === 'card');
            }}
            style={{
              float: 'right',
              marginLeft: 8
            }}
            suffixIcon={
              <DownOutlined
                className='primary-text'
              />
            }
          >
            <Select.Option value="card">Card</Select.Option>
            <Select.Option value="image">Image</Select.Option>
          </Select>
        </div>
      </div>
      <br />

      <div className='full-width flex-center flex-wrap'>
        {filteredCollections.map((filteredCollection, idx) => {
          return <BatchBadgeDetailsTag key={idx} badgeIdObj={filteredCollection} onClose={() => {
            setFilteredCollections(filteredCollections.filter(x => !compareObjects(x, filteredCollection)));
          }} />
        })}
      </div>
      <Divider />
      <div className="flex-center flex-wrap full-width">
        <BadgeInfiniteScroll
          cardView={cardView}
          badgesToShow={filteredCollections.length > 0 ? filteredCollections : collection ? [{
            collectionId,
            badgeIds: getUintRangesForAllBadgeIdsInCollection(collection)
          }] : []}  
          hasMore={false}
          fetchMore={async () => {}}
          groupByCollection={false}
          editMode={false}
          addressOrUsername=''
        />
      {/*       
        <BadgeAvatarDisplay
          collectionId={collectionId}
          cardView={cardView}
          badgeIds={collection ? getUintRangesForAllBadgeIdsInCollection(collection) : []}
          defaultPageSize={cardView ? 25 : 1000}
          hideCollectionLink={true}
          // doNotAdaptToWidth
          showPageJumper
        /> */}
      </div>
    </div>
  );
}
