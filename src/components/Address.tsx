import { getAbbreviatedAddress } from '../utils/AddressUtils';
import { Typography, Tooltip } from 'antd';
import React from 'react';

const { Text } = Typography;

// const blockExplorerLink = (address, blockExplorer) =>
//     `${blockExplorer || 'https://etherscan.io/'}address/${address}`; 

export function Address({
    address, //cosmos bech32 address
    chain,
    blockExplorer,
    size,
    fontSize,
    fontColor,
    hideTooltip,
    hideChain,
}: {
    address: string;
    chain: string;
    blockExplorer?: string;
    size?: string;
    fontSize?: number | string;
    fontColor?: string;
    hideTooltip?: boolean;
    hideChain?: boolean;
}) {
    // const etherscanLink = blockExplorerLink(address, blockExplorer);
    let displayAddress = '';
    let innerContentHtml = <></>;

    if (address) {
        if (!hideChain) {
            displayAddress += `${chain}: `;
        }

        displayAddress += getAbbreviatedAddress(address);
    } else {
        displayAddress = '...';
    }


    const innerContent = !hideTooltip ? (
        <Tooltip
            placement="bottom"
            title={
                <div style={{
                    textAlign: 'center',
                }}>
                    {`${chain}`}
                    <br />
                    {`${address}`}
                </div>
            }
            style={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
            }}
        >
            {displayAddress}
        </Tooltip>
    ) : (
        displayAddress
    );


    return (
        <span>
            <span
                style={{
                    verticalAlign: 'middle',
                    paddingLeft: 5,
                    fontSize: fontSize ? fontSize : 20,
                }}
            >
                {address ? (
                    <Text
                        copyable={{ text: address }}
                        style={{
                            color: fontColor ? fontColor : undefined,
                        }}
                        strong
                    >
                        {innerContent}
                    </Text>
                ) : (
                    <Text
                        copyable={true}
                        style={{
                            color: fontColor ? fontColor : undefined,
                        }}
                        strong
                    >
                        {innerContent}
                    </Text>
                )}
            </span>
        </span>
    );
}
