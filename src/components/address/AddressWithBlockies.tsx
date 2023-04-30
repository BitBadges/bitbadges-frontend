import { Avatar, Tooltip } from "antd";
import { getChainForAddress } from "bitbadgesjs-utils";
import { Address } from "./Address";
import { getChainLogo } from "../../constants";
import { BlockiesAvatar } from "./Blockies";

export function AddressWithBlockies({
    address,
    fontSize,
    addressName,
    resolvedName, 
    addressAvatar,
    fontColor,
    hideTooltip,
    hidePortfolioLink
}: {
    address: string;
    addressName?: string,
    resolvedName?: string,
    addressAvatar?: string,
    fontSize?: number,
    fontColor?: string,
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
                size={fontSize ? fontSize : 20}
            />
        </Tooltip>
        <BlockiesAvatar address={address} avatar={addressAvatar} fontSize={fontSize} />
        <Address
            fontSize={fontSize}
            address={address}
            addressName={addressName}
            resolvedName={resolvedName}
            fontColor={fontColor}
            hidePortfolioLink={hidePortfolioLink}
            hideTooltip={hideTooltip}
        />
    </div>
}