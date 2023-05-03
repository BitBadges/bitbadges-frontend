import { Avatar, Tooltip } from "antd";
import { BitBadgesUserInfo, getChainForAddress } from "bitbadgesjs-utils";
import { Address } from "./Address";
import { getChainLogo } from "../../constants";
import { BlockiesAvatar } from "./Blockies";

export function AddressWithBlockies({
  userInfo,
  fontSize,
  fontColor,
  hideTooltip,
  hidePortfolioLink
}: {
  userInfo: BitBadgesUserInfo,
  fontSize?: number,
  fontColor?: string,
  hidePortfolioLink?: boolean
  hideTooltip?: boolean
}) {
  const address = userInfo?.address || '';
  const chainLogo = getChainLogo(getChainForAddress(address));

  return <div style={{
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  }}>
    <Tooltip
      title={getChainForAddress(address)}
      placement="bottom"
    >
      <Avatar
        src={chainLogo}
        style={{ marginRight: 8 }}
        size={fontSize ? fontSize : 20}
      />
    </Tooltip>
    <BlockiesAvatar address={address} avatar={userInfo.avatar} fontSize={fontSize} />
    <Address
      fontSize={fontSize}
      userInfo={userInfo}
      fontColor={fontColor}
      hidePortfolioLink={hidePortfolioLink}
      hideTooltip={hideTooltip}
    />
  </div>
}