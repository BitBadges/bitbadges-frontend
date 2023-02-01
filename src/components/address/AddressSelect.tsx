import React, { useEffect, useState } from 'react';
import { Input, Select } from 'antd';
import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { COSMOS, ethToCosmos, } from 'bitbadgesjs-address-converter';
import { ethers } from 'ethers';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressDisplay, AddressDisplayTitle } from './AddressDisplay';
import { DEV_MODE } from '../../constants';

const { Option } = Select;

export function AddressSelect({
    onChange,
    title,
    icon,
    fontColor,

}:
    {
        title: string,
        onChange: (userInfo: BitBadgesUserInfo) => void,
        icon?: React.ReactNode,
        fontColor?: string,
    }
) {
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({
        chain: SupportedChain.ETH,
        address: '',
        cosmosAddress: '',
        accountNumber: -1,
    } as BitBadgesUserInfo);

    useEffect(() => {
        onChange(currUserInfo);
    }, [currUserInfo, onChange]);


    return <>
        <AddressDisplayTitle
            accountNumber={currUserInfo.accountNumber ? currUserInfo.accountNumber : -1}
            title={title}
            icon={icon}
        />
        <Input.Group compact style={{ display: 'flex' }}>
            <Select
                value={currUserInfo.chain}
                onSelect={(e: any) =>
                    setCurrUserInfo(
                        {
                            ...currUserInfo,
                            chain: e,
                        }
                    )
                }
                defaultValue={SupportedChain.ETH}
            >
                <Option value={SupportedChain.ETH}>Ethereum</Option>
                <Option value={SupportedChain.COSMOS}>Cosmos</Option>
            </Select>
            <Input
                defaultValue={DEV_MODE ? '0xe00dD9D317573f7B4868D8f2578C65544B153A27' : '0xe00dD9D317573f7B4868D8f2578C65544B153A27'}
                // value={currUserInfo.address}
                onChange={async (e) => {
                    e.preventDefault();
                    let bech32Address = '';
                    if (currUserInfo.chain === SupportedChain.ETH && ethers.utils.isAddress(e.target.value)) {
                        bech32Address = ethToCosmos(e.target.value);
                    } else if (currUserInfo.chain === SupportedChain.COSMOS && e.target.value.startsWith('cosmos')) {
                        bech32Address = e.target.value;
                    }

                    let accountNum = -1;
                    try {
                        COSMOS.decoder(bech32Address); //throws on decode error, so we don't spam getAccountInformation with invalid addresses
                        const acctInformation = await getAccountInformation(bech32Address).then((accountInfo) => {
                            const userInfo: BitBadgesUserInfo = {
                                chain: currUserInfo.chain,
                                address: e.target.value,
                                cosmosAddress: bech32Address,
                                accountNumber: accountInfo.account_number,
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
        <AddressDisplay
            userInfo={currUserInfo}
            fontColor={fontColor}
        />
    </>
}