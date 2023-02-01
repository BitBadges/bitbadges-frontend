import { ethers } from "ethers";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { Address } from "./Address";
import Blockies from 'react-blockies';
import { MINT_ACCOUNT } from "../../constants";

export function AddressWithBlockies({
    address,
    chain,
    fontSize,
    fontColor,
    blockiesScale
}: {
    address: string;
    chain: string;
    fontSize?: number,
    fontColor?: string,
    blockiesScale?: number,
}) {

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
    }}>
        <Blockies scale={blockiesScale} seed={address ? address.toLowerCase() : ''} />
        <Address fontSize={fontSize} address={address} chain={chain} hideChain={true}
            fontColor={
                chain === SupportedChain.ETH && !ethers.utils.isAddress(address) ? 'red' : fontColor
            }
        />
    </div>
}