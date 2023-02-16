import { ethers } from "ethers";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { Address } from "./Address";
import Blockies from 'react-blockies';
import { COSMOS_LOGO, ETH_LOGO, MINT_ACCOUNT, SECONDARY_BLUE, SECONDARY_TEXT } from "../../constants";
import { Avatar, Tooltip } from "antd";
import { COSMOS, cosmosToEth, ethToCosmos } from "bitbadgesjs-address-converter";
import { WarningOutlined } from "@ant-design/icons";
import { AddressDisplay } from "./AddressDisplay";

export function AddressWithBlockies({
    address,
    chain,
    fontSize,
    fontColor,
    blockiesScale,
    accountNumber,
    hidePortfolioLink
}: {
    address: string;
    chain: string;
    fontSize?: number,
    fontColor?: string,
    blockiesScale?: number,
    accountNumber?: number,
    hidePortfolioLink?: boolean
}) {
    let isValidAddress = true;
    let chainLogo = '';

    switch (chain) {
        case SupportedChain.ETH:
        case SupportedChain.UNKNOWN:
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
            isValidAddress = false;
            break;
    }

    if (address === MINT_ACCOUNT.address) {
        isValidAddress = true;
    }


    console.log(chain, address, ethers.utils.isAddress(address), isValidAddress);

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
            hidePortfolioLink={hidePortfolioLink}
        />

        {chain == SupportedChain.UNKNOWN && <Tooltip placement='bottom'
            style={{ minWidth: 400 }}
            color={'black'}
            title={<div style={{ display: 'flex', flexDirection: 'column' }}>
                {"This user's primary chain is unknown."}
                <br />
                {"We have guessed it to be Ethereum."}
                <br />
                <br />
                {"Other possible addresses include: "}
                <br />
                <AddressDisplay
                    fontColor={SECONDARY_TEXT}
                    userInfo={{
                        address: ethToCosmos(address),
                        cosmosAddress: ethToCosmos(address),
                        chain: SupportedChain.COSMOS,
                        accountNumber: -1,
                    }}
                    hidePortfolioLink

                />

                <br />
            </div>}>
            <WarningOutlined
                style={{
                    color: 'orange',
                    margin: 4
                }}
            />
        </Tooltip>}
    </div>
}