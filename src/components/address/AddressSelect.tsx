import React, { useEffect, useState } from 'react';
import { Divider, Input, Select, Switch } from 'antd';
import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { COSMOS, ethToCosmos, } from 'bitbadgesjs-address-converter';
import { ethers } from 'ethers';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressDisplay, AddressDisplayTitle } from './AddressDisplay';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';

const { Option } = Select;

export enum EnterMethod {
    Manual = 'Manual',
    Upload = 'Upload',
}

export function AddressSelect({
    enterMethod,
    setEnterMethod,
    currUserInfo,
    setCurrUserInfo,
    title,
    icon,
    fontColor,
    darkMode,

}:
    {
        title: string,
        currUserInfo: BitBadgesUserInfo,
        setCurrUserInfo: (currUserInfo: BitBadgesUserInfo) => void,
        icon?: React.ReactNode,
        fontColor?: string,
        enterMethod?: EnterMethod,
        setEnterMethod?: (enterMethod: EnterMethod) => void,
        darkMode?: boolean,
    }
) {



    return <>

        <br />
        <Input.Group compact style={{ display: 'flex' }}>
            <Select
                // style={darkMode ? {
                //     backgroundColor: PRIMARY_BLUE,
                //     color: PRIMARY_TEXT
                // } : undefined}
                value={currUserInfo.chain}
                onSelect={async (e: any) => {
                    // e.preventDefault();
                    let bech32Address = '';
                    if (e === SupportedChain.ETH && ethers.utils.isAddress(currUserInfo.address)) {
                        bech32Address = ethToCosmos(currUserInfo.address);
                    } else if (e === SupportedChain.COSMOS) {
                        try {
                            COSMOS.decoder(currUserInfo.address); //throws on decode error, so we don't spam getAccountInformation with invalid addresses
                            bech32Address = currUserInfo.address;
                        } catch (err) {

                        }
                    }

                    setCurrUserInfo({
                        chain: e,
                        address: currUserInfo.address,
                        cosmosAddress: bech32Address,
                        accountNumber: -1,
                    });

                    console.log({
                        chain: e,
                        address: currUserInfo.address,
                        cosmosAddress: bech32Address,
                        accountNumber: -1,
                    });

                    let accountNum = -1;
                    try {
                        console.log(currUserInfo.address)
                        COSMOS.decoder(currUserInfo.address); //throws on decode error, so we don't spam getAccountInformation with invalid addresses
                        const acctInformation = await getAccountInformation(currUserInfo.address).then((accountInfo) => {
                            const userInfo: BitBadgesUserInfo = {
                                chain: e,
                                address: currUserInfo.address,
                                cosmosAddress: bech32Address,
                                accountNumber: accountInfo.account_number,
                            }
                            return userInfo;
                        });

                        accountNum = acctInformation.accountNumber;
                    } catch (err) {
                        if (DEV_MODE) console.log("Did not get account information because cosmos address is invalid", err);
                    }

                    console.log(accountNum);
                    setCurrUserInfo({
                        chain: e,
                        address: currUserInfo.address,
                        cosmosAddress: bech32Address,
                        accountNumber: accountNum,
                    });
                }}
                defaultValue={SupportedChain.ETH}
            >
                <Option value={SupportedChain.ETH}>Ethereum</Option>
                <Option value={SupportedChain.COSMOS}>Cosmos</Option>
            </Select>
            <Input
                // defaultValue={DEV_MODE ? '0xe00dD9D317573f7B4868D8f2578C65544B153A27' : ''}
                value={currUserInfo.address}
                style={darkMode ? {
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT
                } : undefined}
                onChange={async (e) => {
                    e.preventDefault();
                    let bech32Address = '';
                    if (currUserInfo.chain === SupportedChain.ETH && ethers.utils.isAddress(e.target.value)) {
                        bech32Address = ethToCosmos(e.target.value);
                    } else if (currUserInfo.chain === SupportedChain.COSMOS && e.target.value.startsWith('cosmos')) {
                        bech32Address = e.target.value;
                    }

                    setCurrUserInfo({
                        chain: currUserInfo.chain,
                        address: e.target.value,
                        cosmosAddress: bech32Address,
                        accountNumber: -1,
                    });

                    let accountNum = -1;
                    try {
                        COSMOS.decoder(bech32Address); //throws on decode error, so we don't spam getAccountInformation with invalid addresses
                        const acctInformation = await getAccountInformation(bech32Address).then((accountInfo) => {
                            const userInfo: BitBadgesUserInfo = {
                                chain: currUserInfo.chain,
                                address: e.target.value,
                                cosmosAddress: bech32Address,
                                accountNumber: Number(accountInfo.account_number),
                            }
                            return userInfo;
                        });

                        accountNum = acctInformation.accountNumber;
                    } catch (err) {
                        if (DEV_MODE) console.log("Did not get account information because cosmos address is invalid");
                    }


                    setCurrUserInfo({
                        chain: currUserInfo.chain,
                        address: e.target.value,
                        cosmosAddress: bech32Address,
                        accountNumber: accountNum,
                    });
                }}
            />
        </Input.Group>
        <br />
        <AddressDisplay
            userInfo={currUserInfo}
            fontColor={fontColor}
            showAccountNumber
        />
    </>
}