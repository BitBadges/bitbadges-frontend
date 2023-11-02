import { Divider, Select } from 'antd';
import { useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { getUintRangesForAllBadgeIdsInCollection } from 'bitbadgesjs-utils';

import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';

export function BadgesTab({ collectionId }: {
  collectionId: bigint
}) {
  const [cardView, setCardView] = useState(true);

  const collection = useCollection(collectionId)

  return (
    <div className='primary-text full-width'>
      <br />

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
      <Divider />
      <div className="flex-center flex-wrap full-width">
        <BadgeAvatarDisplay
          collectionId={collectionId}
          cardView={cardView}
          badgeIds={collection ? getUintRangesForAllBadgeIdsInCollection(collection) : []}
          defaultPageSize={cardView ? 25 : 1000}
          hideCollectionLink={true}
          // doNotAdaptToWidth
          showPageJumper
        />
      </div>
    </div>
  );
}
