import { Divider, Select } from 'antd';
import { useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { getIdRangesForAllBadgeIdsInCollection } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';

export function BadgesTab({ collectionId }: {
  collectionId: bigint
}) {
  const [cardView, setCardView] = useState(true);
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  return (
    <div className='primary-text'>
      <br />

      <div className='primary-text primary-blue-bg' style={{
        float: 'right',
        display: 'flex',
        alignItems: 'center',
        marginLeft: 16,
        marginRight: 16
      }}>
        View:

        <Select
          className="selector primary-text primary-blue-bg"
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
      <Divider />
      <div>
        <BadgeAvatarDisplay
          collectionId={collectionId}
          cardView={cardView}
          badgeIds={collection ? getIdRangesForAllBadgeIdsInCollection(collection) : []}
          pageSize={cardView ? 25 : 1000}
          hideCollectionLink={true}
        />
      </div>
    </div >
  );
}
