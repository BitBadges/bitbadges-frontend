import { WarningOutlined } from "@ant-design/icons";
import { Avatar, Tooltip } from "antd";
import { ethToCosmos } from "bitbadgesjs-address-converter";
import Blockies from 'react-blockies';
import { getChainLogo } from "../../bitbadges-api/chains";
import { SupportedChain } from "../../bitbadges-api/types";
import { SECONDARY_TEXT } from "../../constants";
import { Address } from "./Address";
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
    const chainLogo = getChainLogo(chain);

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
            chain={chain}
            accountNumber={accountNumber}
            fontColor={fontColor}
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