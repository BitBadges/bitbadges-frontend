import { Card, Typography } from 'antd';
import { AddressMappingWithMetadata } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { BadgeAvatar } from './BadgeAvatar';
import { useEffect } from 'react';

export function AddressListCard({
  addressMapping,
  addressOrUsername
}: {
  addressMapping: AddressMappingWithMetadata<bigint>
  addressOrUsername?: string
}) {
  const router = useRouter();
  const accounts = useAccountsContext();
  const accountInfo = addressOrUsername ? accounts.getAccount(addressOrUsername) : undefined;


  const explicitly = accountInfo ? addressMapping.addresses.includes(accountInfo.address) || addressMapping.addresses.includes(accountInfo.cosmosAddress) : false


  return (
    <div style={{ margin: 16 }}>
      <Card
        className='primary-text primary-blue-bg'
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
        <Typography.Text strong className='primary-text'>
          {addressMapping.metadata?.name}
        </Typography.Text>
        {accountInfo && <>
          <br />
          <br />
        </>}
        {accountInfo ? addressMapping.includeAddresses ?
          <Typography.Text strong className='primary-text' style={{ color: 'green' }}>
            {explicitly ? '' : 'SOFT'} INCLUDED
          </Typography.Text>
          :
          <Typography.Text strong className='primary-text' style={{ color: 'red' }}>
            {explicitly ? 'SOFT' : ''} EXCLUDED
          </Typography.Text>
          : <></>}

        {addressMapping.createdBy && <>
          <br />
          <br />
          <b>Created By</b>

          <AddressDisplay
            addressOrUsername={addressMapping.createdBy}
            fontSize={13}
          />
        </>
        }
        {addressMapping.lastUpdated > 0n && <>
          <br />
          <b>Last Updated</b>
          <br />
          {new Date(Number(addressMapping.lastUpdated)).toLocaleString()}
        </>
        }
      </Card>

    </div>
  );
}
