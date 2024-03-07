import { Avatar, Tooltip } from 'antd';
import { SupportedChain, getChainForAddress } from 'bitbadgesjs-sdk';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { getChainLogo } from '../../constants';
import { Address } from './Address';
import { BlockiesAvatar } from './Blockies';

export function AddressWithBlockies({
  addressOrUsername,
  fontSize = 16,
  fontColor,
  hideTooltip,
  hidePortfolioLink,
  overrideChain,
  doNotShowName
}: {
  addressOrUsername: string;
  fontSize?: number;
  fontColor?: string;
  hidePortfolioLink?: boolean;
  hideTooltip?: boolean;
  overrideChain?: SupportedChain;
  doNotShowName?: boolean;
}) {
  const fetchedAccount = useAccount(addressOrUsername);

  const userInfo = fetchedAccount ? fetchedAccount.clone() : undefined;
  if (userInfo && overrideChain != null) {
    userInfo.address =
      overrideChain === SupportedChain.BTC
        ? userInfo.btcAddress
        : overrideChain === SupportedChain.COSMOS
          ? userInfo.cosmosAddress
          : overrideChain === SupportedChain.ETH
            ? userInfo.ethAddress
            : userInfo.solAddress;
    userInfo.chain = overrideChain;
  }

  const address = userInfo?.address || addressOrUsername || '';
  const chainLogo = getChainLogo(overrideChain ?? getChainForAddress(address));

  if (overrideChain != null) {
    if (userInfo?.chain === SupportedChain.UNKNOWN) {
      overrideChain = undefined;
      // throw new Error(`Cannot call overrideChain with UNKNOWN chain`);
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {address !== 'Mint' && address !== 'All' && (
        <Tooltip
          title={getChainForAddress(address) !== SupportedChain.UNKNOWN ? `This address is for a ${getChainForAddress(address)} user` : `Unknown`}
          placement="bottom">
          <Avatar src={chainLogo} style={{ marginRight: 8 }} size={fontSize} />
        </Tooltip>
      )}
      <BlockiesAvatar shape="square" address={address} avatar={userInfo?.profilePicUrl ?? userInfo?.avatar} fontSize={fontSize} />
      <Address
        fontSize={fontSize}
        addressOrUsername={addressOrUsername}
        fontColor={fontColor}
        hidePortfolioLink={hidePortfolioLink}
        hideTooltip={hideTooltip}
        overrideChain={overrideChain}
        doNotShowName={doNotShowName}
      />
    </div>
  );
}
