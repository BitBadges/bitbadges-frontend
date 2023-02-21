import { Avatar, Tooltip } from "antd";
import Blockies from 'react-blockies';
import { getChainForAddress, getChainLogo } from "../../bitbadges-api/chains";
import { Address } from "./Address";

export function AddressWithBlockies({
    address,
    fontSize,
    addressName,
    fontColor,
    blockiesScale,
    hideTooltip,
    hidePortfolioLink
}: {
    address: string;
    addressName?: string,
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
        alignItems: 'center',
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
        <Blockies scale={blockiesScale} seed={address ? address.toLowerCase() : ''} />
        <Address fontSize={fontSize}
            address={address}
            addressName={addressName}
            fontColor={fontColor}
            hidePortfolioLink={hidePortfolioLink}
            hideTooltip={hideTooltip}
        />
    </div>
}