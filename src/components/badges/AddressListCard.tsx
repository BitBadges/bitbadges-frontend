import { Card, Typography } from 'antd';
import { BitBadgesAddressList } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';

import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { BadgeAvatar } from './BadgeAvatar';
import { ListCustomizeButtons } from './MultiCollectionCustomizeButtons';

export function AddressListCard({
  addressList,
  addressOrUsername,
  hideInclusionDisplay,
  showCustomizeButtons,
  currPageName,
  isWatchlist,
  showMustBeOn,
  showMustNotBeOn
}: {
  addressList: BitBadgesAddressList<bigint>;
  addressOrUsername?: string;
  hideInclusionDisplay?: boolean;
  showCustomizeButtons?: boolean;
  currPageName?: string;
  isWatchlist?: boolean;
  showMustBeOn?: boolean;
  showMustNotBeOn?: boolean;
}) {
  const router = useRouter();
  const accountInfo = useAccount(addressOrUsername);

  return (
    <Card
      className="primary-text card-bg rounded-lg"
      style={{
        margin: 6,
        textAlign: 'center',
        minWidth: 200
      }}
      hoverable={true}
      onClick={() => {
        router.push(`/lists/${addressList.listId}`);
      }}
      cover={
        <>
          <div className="flex-center full-width primary-text" style={{ marginTop: '1rem' }}>
            <BadgeAvatar collectionId={0n} metadataOverride={addressList.metadata} size={75} />
          </div>
        </>
      }>
      <Typography.Text strong className="primary-text" style={{ fontSize: 20 }}>
        {addressList.metadata?.name}
      </Typography.Text>
      <br />
      <Typography.Text strong className="secondary-text">
        {addressList.whitelist ? 'Whitelist' : 'Blacklist'}
        <br />
        {addressList.addresses.length} address{addressList.addresses.length === 1 ? '' : 'es'}
      </Typography.Text>
      {accountInfo && !hideInclusionDisplay && (
        <>
          <br />
          <br />
        </>
      )}
      {accountInfo && !hideInclusionDisplay ? (
        addressList.whitelist ? (
          <Typography.Text strong style={{ color: 'green' }}>
            INCLUDED
          </Typography.Text>
        ) : (
          <Typography.Text strong style={{ color: 'red' }}>
            EXCLUDED
          </Typography.Text>
        )
      ) : (
        <></>
      )}

      <br />
      {showMustBeOn && (
        <Typography.Text strong style={{ color: 'green' }}>
          Must Be On List
        </Typography.Text>
      )}
      {showMustNotBeOn && (
        <Typography.Text strong style={{ color: 'red' }}>
          Must Not Be On List
        </Typography.Text>
      )}
      {showCustomizeButtons && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}>
          <div className="flex-center full-width primary-text">
            <ListCustomizeButtons
              listId={addressList.listId.toString()}
              showCustomizeButtons={showCustomizeButtons}
              addressOrUsername={addressOrUsername}
              isWatchlist={isWatchlist}
              currPage={currPageName}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
