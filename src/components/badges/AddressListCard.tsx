import { Card, Typography } from 'antd';
import { AddressMappingWithMetadata } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { BadgeAvatar } from './BadgeAvatar';

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


  // const explicitly = accountInfo ? addressMapping.addresses.includes(accountInfo.address) || addressMapping.addresses.includes(accountInfo.cosmosAddress) : false


  return (
    <div style={{}}>
      <Card
        className='dark:text-white gradient-bg'
        style={{
          width: 225,
          marginTop: 8,
          marginRight: 8,
          textAlign: 'center',
          borderRadius: '4%',
        }}
        hoverable={true}
        onClick={() => {
          router.push(`/addresses/${addressMapping.mappingId}`);
        }}
        cover={<>
          <div className='flex-center full-width dark:text-white' style={{ marginTop: '1rem' }}>
            <BadgeAvatar
              collectionId={0n}
              metadataOverride={addressMapping.metadata}
              size={75}
            />
          </div>
        </>}
      >
        <Typography.Text strong className='dark:text-white'>
          {addressMapping.metadata?.name}
        </Typography.Text>
        {accountInfo && <>
          <br />
          <br />
        </>}
        {accountInfo ? addressMapping.includeAddresses ?
          <Typography.Text strong style={{ color: 'green' }}>
            {/* {explicitly ? '' : 'SOFT'} */}
            INCLUDED
          </Typography.Text>
          :
          <Typography.Text strong style={{ color: 'red' }}>
            {/* {explicitly ? 'SOFT' : ''}  */}
            EXCLUDED
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
        {addressMapping.updateHistory.length > 0 && <>
          <br />
          <b>Last Updated</b>
          <br />
          {new Date(Number(addressMapping.updateHistory.sort((a, b) => b.blockTimestamp - a.blockTimestamp > 0 ? 1 : -1)[0].blockTimestamp)).toLocaleString()}
        </>
        }
      </Card>

    </div>
  );
}
