import { ethers } from "ethers";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { Address } from "./Address";
import Blockies from 'react-blockies';
import { COSMOS_LOGO, ETH_LOGO, MINT_ACCOUNT } from "../../constants";
import { Avatar, Tooltip } from "antd";
import { COSMOS } from "bitbadgesjs-address-converter";

export function AddressWithBlockies({
    address,
    chain,
    fontSize,
    fontColor,
    blockiesScale,
    accountNumber,
}: {
    address: string;
    chain: string;
    fontSize?: number,
    fontColor?: string,
    blockiesScale?: number,
    accountNumber?: number,
}) {
    let isValidAddress = true;
    let chainLogo = '';
    switch (chain) {
        case SupportedChain.ETH:
            chainLogo = ETH_LOGO;
            isValidAddress = ethers.utils.isAddress(address);
            break;
        case SupportedChain.COSMOS:
            chainLogo = COSMOS_LOGO;

            try {
                COSMOS.decoder(address);
            } catch {
                isValidAddress = false;
            }
            break;
        default:
            chainLogo = ETH_LOGO;
            break;
    }

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
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
        <Address fontSize={fontSize} address={address} chain={chain} hideChain={true}
            accountNumber={accountNumber}
            fontColor={
                !isValidAddress ? 'red' : fontColor
            }
        />
    </div>
}