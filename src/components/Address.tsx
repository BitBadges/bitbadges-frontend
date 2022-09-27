import { getAbbreviatedAddress } from '../utils/AddressUtils';

import { Typography, Tooltip } from 'antd';
import React from 'react';
import { SECONDARY_TEXT } from '../constants';
const { Text } = Typography;

// const blockExplorerLink = (address, blockExplorer) =>
//     `${blockExplorer || 'https://etherscan.io/'}address/${address}`;

export function Address({
    address,
    blockExplorer,
    size,
    fontSize,
    fontColor,
    showTooltip,
}: {
    address: string;
    blockExplorer?: string;
    size?: string;
    fontSize?: number | string;
    fontColor?: string;
    showTooltip?: boolean;
}) {
    // const etherscanLink = blockExplorerLink(address, blockExplorer);
    let displayAddress = '';

    if (address) {
        displayAddress = 'ETH: ' + getAbbreviatedAddress(address);

        if (size === 'long') {
            displayAddress = 'ETH: ' + address;
        }
    } else {
        displayAddress = 'Please Enter an Address';
    }

    const innerContent = showTooltip ? (
        <Tooltip
            placement="bottom"
            title={
                <div style={{
                    textAlign: 'center',
                }}>
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
                            color: fontColor ? fontColor : SECONDARY_TEXT,
                        }}
                        strong
                    >
                        {innerContent}
                    </Text>
                ) : (
                    <Text
                        copyable={true}
                        style={{
                            color: fontColor ? fontColor : SECONDARY_TEXT,
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
