import { Avatar, Tooltip } from "antd";
import Blockies from 'react-blockies';
import { getChainForAddress, getChainLogo } from "../../bitbadges-api/chains";
import { Address } from "./Address";

export function AddressWithBlockies({
    address,
    chain,
    fontSize,
    addressName,
    fontColor,
    blockiesScale,
    accountNumber,
    hidePortfolioLink
}: {
    address: string;
    chain: string;
    addressName?: string,
    fontSize?: number,
    fontColor?: string,
    blockiesScale?: number,
    accountNumber?: number,
    hidePortfolioLink?: boolean
}) {
    const chainLogo = getChainLogo(getChainForAddress(address));

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    }}>
        <Tooltip
            title={chain}
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
            chain={chain}
            accountNumber={accountNumber}
            fontColor={fontColor}
            hidePortfolioLink={hidePortfolioLink}
        />
    </div>
}