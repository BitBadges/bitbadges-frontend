import { Avatar, Tooltip } from "antd";
import { getChainForAddress } from "bitbadgesjs-utils";
import { Address } from "./Address";
import { getChainLogo } from "../../constants";
import { BlockiesAvatar } from "./Blockies";

export function AddressWithBlockies({
    address,
    fontSize,
    addressName,
    addressAvatar,
    fontColor,
    blockiesScale,
    hideTooltip,
    hidePortfolioLink
}: {
    address: string;
    addressName?: string,
    addressAvatar?: string,
    fontSize?: number,
    fontColor?: string,
    blockiesScale?: number,
    accountNumber?: number,
    hidePortfolioLink?: boolean
    hideTooltip?: boolean
}) {
    const chainLogo = getChainLogo(getChainForAddress(address));

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        // justifyContent: 'center'
    }}>
        <Tooltip
            title={getChainForAddress(address)}
            placement="bottom"
        >
            <Avatar
                src={chainLogo}
                style={{ marginRight: 8 }}
            />
        </Tooltip>
        <BlockiesAvatar blockiesScale={blockiesScale} address={address} avatar={addressAvatar} />
        <Address
            fontSize={fontSize}
            address={address}
            addressName={addressName}
            fontColor={fontColor}
            hidePortfolioLink={hidePortfolioLink}
            hideTooltip={hideTooltip}
        />
    </div>
}