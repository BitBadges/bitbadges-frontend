import { Avatar, Tooltip } from "antd";
import { BigIntify, SupportedChain, convertBitBadgesUserInfo, getChainForAddress } from "bitbadgesjs-utils";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { getChainLogo } from "../../constants";
import { Address } from "./Address";
import { BlockiesAvatar } from "./Blockies";

export function AddressWithBlockies({
  addressOrUsername,
  fontSize = 20,
  fontColor,
  hideTooltip,
  hidePortfolioLink,
  overrideChain,
  doNotShowName
}: {
  addressOrUsername: string;
  fontSize?: number,
  fontColor?: string,
  hidePortfolioLink?: boolean
  hideTooltip?: boolean,
  overrideChain?: SupportedChain,
  doNotShowName?: boolean
}) {
  const accounts = useAccountsContext();

  const fetchedAccount = accounts.getAccount(addressOrUsername);
  const userInfo = fetchedAccount ? convertBitBadgesUserInfo(fetchedAccount, BigIntify) : undefined; //deep copy

  if (userInfo?.chain === SupportedChain.UNKNOWN && overrideChain) {
    overrideChain = undefined;
    // throw new Error(`Cannot call overrideChain with UNKNOWN chain`);
  }


  const address = userInfo?.address || addressOrUsername || '';
  const chainLogo = getChainLogo(overrideChain ?? getChainForAddress(address));

  return <div style={{ display: 'inline-flex', alignItems: 'center' }}>
    {address !== 'Mint' && address !== 'All' &&
      <Tooltip
        title={getChainForAddress(address)}
        placement="bottom"
      >
        <Avatar
          src={chainLogo}
          style={{ marginRight: 8 }}
          size={fontSize}
        />
      </Tooltip>}
    <BlockiesAvatar address={address} avatar={userInfo?.profilePicUrl ?? userInfo?.avatar} fontSize={fontSize} />
    <Address
      fontSize={fontSize}
      addressOrUsername={addressOrUsername}
      fontColor={fontColor}
      hidePortfolioLink={hidePortfolioLink}
      hideTooltip={hideTooltip}
      overrideChain={overrideChain}
      doNotShowName={doNotShowName}
    />
  </div >
}