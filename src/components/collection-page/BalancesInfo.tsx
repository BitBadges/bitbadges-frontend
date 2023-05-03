import { Empty } from 'antd';
import { BitBadgeCollection, BitBadgesUserInfo, UserBalance, isAddressValid } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { BLANK_USER_INFO, PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../balances/BalanceDisplay';


export function BalanceOverview({ collection, isPreview }: {
  collection: BitBadgeCollection | undefined;
  isPreview?: boolean;
}) {
  const chain = useChainContext();
  const [currBalance, setCurrBalance] = useState<UserBalance>();
  const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>(chain.connected ? {
    name: chain.name,
    avatar: chain.avatar,
    chain: chain.chain,
    address: chain.address,
    cosmosAddress: chain.cosmosAddress,
    accountNumber: chain.accountNumber,
    github: chain.github,
    discord: chain.discord,
    twitter: chain.twitter,
    telegram: chain.telegram,
    readme: chain.readme,
  } : BLANK_USER_INFO);

  useEffect(() => {
    if (chain.connected) {
      setCurrUserInfo({
        name: chain.name,
        avatar: chain.avatar,
        chain: chain.chain,
        address: chain.address,
        cosmosAddress: chain.cosmosAddress,
        accountNumber: chain.accountNumber,
        github: chain.github,
        discord: chain.discord,
        twitter: chain.twitter,
        telegram: chain.telegram,
        readme: chain.readme
      });
    }
  }, [chain]);

  useEffect(() => {
    async function refreshBalance() {
      if (isAddressValid(currUserInfo.address) && collection) {
        try {
          const res = await getBadgeBalance(collection.collectionId, currUserInfo.accountNumber);
          setCurrBalance(res.balance);
          return;
        } catch (e) { }
      }

      setCurrBalance({
        balances: [],
        approvals: []
      });
    }

    refreshBalance();
  }, [currUserInfo, collection])

  if (!collection) return <></>;

  return (<div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
      <AddressSelect defaultValue={currUserInfo.address} onUserSelect={setCurrUserInfo} darkMode fontColor={PRIMARY_TEXT} />
      {<>
        <br />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AddressDisplay userInfo={currUserInfo} darkMode fontColor={PRIMARY_TEXT} />
        </div>
      </>}
    </div>
    <div
      style={{ color: PRIMARY_TEXT, display: 'flex', justifyContent: 'center', width: '100%', marginTop: 16 }}
    >
      {isPreview && <>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ color: PRIMARY_TEXT }}
          description={<span style={{ color: PRIMARY_TEXT }}>Not supported for previews.</span>}
        ></Empty>
      </>}
      {
        currBalance && !isPreview && <>
          {<div>
            {<BalanceDisplay
              collection={collection}
              balance={currBalance}
            />}
          </div>}
        </>
      }
    </div>
  </div>
  );
}
