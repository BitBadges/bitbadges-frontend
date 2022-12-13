import { getAbbreviatedAddress } from '../utils/AddressUtils';

import { Typography, Tooltip } from 'antd';
import React from 'react';
import { SECONDARY_TEXT } from '../constants';
import { getAccountInformation } from '../bitbadges-api/api';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
const { Text } = Typography;

// const blockExplorerLink = (address, blockExplorer) =>
//     `${blockExplorer || 'https://etherscan.io/'}address/${address}`; 

export function Address({
    address, //cosmos bech32 address
    chainToDisplay, //defaults to guessing
    blockExplorer,
    size,
    fontSize,
    fontColor,
    showTooltip,
}: {
    address: string;
    chainToDisplay?: 'eth' | 'cosmos' | undefined;
    blockExplorer?: string;
    size?: string;
    fontSize?: number | string;
    fontColor?: string;
    showTooltip?: boolean;
}) {
    // const etherscanLink = blockExplorerLink(address, blockExplorer);
    let displayAddress = '';
    let innerContentHtml = <></>;

    //TODO:
    if (address) {
        displayAddress = 'ETH: ' + getAbbreviatedAddress(address);
        // switch (chainToDisplay) {
        //     case 'eth':
        //         displayAddress = 'ETH: ' + getAbbreviatedAddress(cosmosToEth(address));
        //         innerContentHtml = <>COSMOS: {getAbbreviatedAddress(address)}</>
        //         break;
        //     case 'cosmos':
        //     default:
        //         displayAddress = getAbbreviatedAddress(address);
        //         innerContentHtml = <>ETH: {getAbbreviatedAddress(cosmosToEth(address))}</>
        //         break;
        // }
    } else {
        displayAddress = 'Please Enter an Address';
    }



    //todo: overlay tooltip
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
