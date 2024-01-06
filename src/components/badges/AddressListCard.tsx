import { Card, Typography } from 'antd';
import { AddressMappingWithMetadata } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';

import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { BadgeAvatar } from './BadgeAvatar';

export function AddressListCard({
  addressMapping,
  addressOrUsername,
  hideInclusionDisplay,
}: {
  addressMapping: AddressMappingWithMetadata<bigint>
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
        router.push(`/lists/${addressMapping.mappingId}`);
      }}
      cover={<>
        <div className='flex-center full-width primary-text' style={{ marginTop: '1rem' }}>
          <BadgeAvatar
            collectionId={0n}
            metadataOverride={addressMapping.metadata}
            size={75}
          />
        </div>
      </>}
    >
      <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
        {addressMapping.metadata?.name}
      </Typography.Text>
      <br />
      <Typography.Text strong className='secondary-text'>
        {addressMapping.includeAddresses ? 'Whitelist' : 'Blacklist'}
        <br />
        {addressMapping.addresses.length} address{addressMapping.addresses.length === 1 ? '' : 'es'}
      </Typography.Text>
      {accountInfo && !hideInclusionDisplay && <>
        <br />
        <br />
      </>}
      {accountInfo && !hideInclusionDisplay ? addressMapping.includeAddresses ?
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
