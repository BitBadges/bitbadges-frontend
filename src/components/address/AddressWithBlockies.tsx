import { Avatar, Tooltip } from "antd";
import { BigIntify, SupportedChain, convertBitBadgesUserInfo, getChainForAddress } from "bitbadgesjs-utils";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { getChainLogo } from "../../constants";
import { Address } from "./Address";
import { BlockiesAvatar } from "./Blockies";
import { cosmosToEth } from "bitbadgesjs-address-converter";

export function AddressWithBlockies({
  addressOrUsername,
  fontSize = 20,
  fontColor,
  hideTooltip,
  hidePortfolioLink,
  overrideChain
}: {
  addressOrUsername: string;
  fontSize?: number,
  fontColor?: string,
  hidePortfolioLink?: boolean
  hideTooltip?: boolean,
  overrideChain?: SupportedChain
}) {
  const accounts = useAccountsContext();

  const fetchedAccount = accounts.getAccount(addressOrUsername);
  const userInfo = fetchedAccount ? convertBitBadgesUserInfo(fetchedAccount, BigIntify) : undefined; //deep copy

  if (userInfo?.chain === SupportedChain.UNKNOWN && overrideChain) {
    throw new Error(`Cannot call overrideChain with UNKNOWN chain`);
  }

  if (userInfo && overrideChain && userInfo?.chain !== overrideChain && overrideChain === SupportedChain.COSMOS) {
    userInfo.chain = overrideChain;
    userInfo.address = userInfo.cosmosAddress;
  } else if (userInfo && overrideChain && userInfo?.chain !== overrideChain) {
    userInfo.chain = overrideChain;
    userInfo.address = cosmosToEth(userInfo.cosmosAddress);
  }

  const address = userInfo?.address || '';
  const chainLogo = getChainLogo(getChainForAddress(address));

  return <div className="flex-center flex-wrap">
    <Tooltip
      title={getChainForAddress(address)}
      placement="bottom"
    >
      <Avatar
        src={chainLogo}
        style={{ marginRight: 8 }}
        size={fontSize}
      />
    </Tooltip>
    <BlockiesAvatar address={address} avatar={userInfo?.avatar} fontSize={fontSize} />
    <Address
      fontSize={fontSize}
      addressOrUsername={addressOrUsername}
      fontColor={fontColor}
      hidePortfolioLink={hidePortfolioLink}
      hideTooltip={hideTooltip}
    />
  </div>
}