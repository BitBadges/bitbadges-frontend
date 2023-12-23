import { Avatar, Tooltip } from "antd";
import { BigIntify, SupportedChain, convertBitBadgesUserInfo, cosmosToBtc, getChainForAddress } from "bitbadgesjs-utils";
import { getChainLogo } from "../../constants";
import { Address } from "./Address";
import { BlockiesAvatar } from "./Blockies";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";

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
  fontSize?: number,
  fontColor?: string,
  hidePortfolioLink?: boolean
  hideTooltip?: boolean,
  overrideChain?: SupportedChain,
  doNotShowName?: boolean
}) {

  const chainContext = useChainContext();
  const fetchedAccount = useAccount(addressOrUsername);

  const userInfo = fetchedAccount ? convertBitBadgesUserInfo({
    ...fetchedAccount,
    address:      overrideChain ? 
    overrideChain === SupportedChain.BTC ? cosmosToBtc(fetchedAccount.cosmosAddress) :
    overrideChain === SupportedChain.COSMOS ? fetchedAccount.cosmosAddress :
          overrideChain === SupportedChain.ETH ?            fetchedAccount.ethAddress
            : fetchedAccount.solAddress
        : chainContext.cosmosAddress == fetchedAccount.address ? chainContext.address : fetchedAccount.address,
    chain: overrideChain ? overrideChain : chainContext.cosmosAddress == fetchedAccount.address ? chainContext.chain : fetchedAccount.chain
  }, BigIntify) : undefined; //deep copy
  const address = userInfo?.address || addressOrUsername || '';
  const chainLogo = getChainLogo(overrideChain ?? getChainForAddress(address));

  if (overrideChain) {
    if (userInfo?.chain === SupportedChain.UNKNOWN) {
      overrideChain = undefined;
      // throw new Error(`Cannot call overrideChain with UNKNOWN chain`);
    }
  }



  return <div style={{ display: 'inline-flex', alignItems: 'center' }}>
    {address !== 'Mint' && address !== 'All' &&
      <Tooltip
        title={getChainForAddress(address) !== SupportedChain.UNKNOWN ? `This address is for a ${getChainForAddress(address)} user` : `Unknown`}
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