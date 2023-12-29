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
      className='primary-text card-bg'
      style={{
        width: 225,
        margin: 8,
        textAlign: 'center',
        borderRadius: '4%',
      }}
      hoverable={true}
      onClick={() => {
        router.push(`/addresses/${addressMapping.mappingId}`);
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
      {/* {addressMapping.createdBy && <>
          <br />
          <br />
          <b>Created By</b>

          <AddressDisplay
            addressOrUsername={addressMapping.createdBy}
            fontSize={13}
          />
        </>
        } */}
      {/* {addressMapping.updateHistory.length > 0 && <>
          <br />
          <b>Last Updated</b>
          <br />
          {new Date(Number(addressMapping.updateHistory.sort((a, b) => b.blockTimestamp - a.blockTimestamp > 0 ? 1 : -1)[0].blockTimestamp)).toLocaleString()}
        </>
        } */}
    </Card>

  );
}
