import { Card, Typography } from 'antd';
import { AddressListWithMetadata } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';

import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { BadgeAvatar } from './BadgeAvatar';

export function AddressListCard({
  addressList,
  addressOrUsername,
  hideInclusionDisplay,
}: {
  addressList: AddressListWithMetadata<bigint>
  addressOrUsername?: string
  hideInclusionDisplay?: boolean
}) {
  const router = useRouter();
  const accountInfo = useAccount(addressOrUsername);

  return (
    <Card
      className='primary-text card-bg rounded-lg'
      style={{
        margin: 6,
        textAlign: 'center',
        minWidth: 200,
      }}
      hoverable={true}
      onClick={() => {
        router.push(`/lists/${addressList.listId}`);
      }}
      cover={<>
        <div className='flex-center full-width primary-text' style={{ marginTop: '1rem' }}>
          <BadgeAvatar
            collectionId={0n}
            metadataOverride={addressList.metadata}
            size={75}
          />
        </div>
      </>}
    >
      <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
        {addressList.metadata?.name}
      </Typography.Text>
      <br />
      <Typography.Text strong className='secondary-text'>
        {addressList.allowlist ? 'Allowlist' : 'Blocklist'}
        <br />
        {addressList.addresses.length} address{addressList.addresses.length === 1 ? '' : 'es'}
      </Typography.Text>
      {accountInfo && !hideInclusionDisplay && <>
        <br />
        <br />
      </>}
      {accountInfo && !hideInclusionDisplay ? addressList.allowlist ?
        <Typography.Text strong style={{ color: 'green' }}>
          INCLUDED
        </Typography.Text>
        :
        <Typography.Text strong style={{ color: 'red' }}>
          EXCLUDED
        </Typography.Text>
        : <></>}
      <br />
    </Card>

  );
}
