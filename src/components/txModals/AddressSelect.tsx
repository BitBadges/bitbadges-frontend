import React, { useEffect, useState } from 'react';
import { Input, Select } from 'antd';
import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { ethToCosmos, } from 'bitbadgesjs-address-converter';
import { ethers } from 'ethers';
import { getAccountInformation } from '../../bitbadges-api/api';
import { AddressModalDisplay, AddressModalDisplayTitle } from './AddressModalDisplay';

const { Option } = Select;

export function AddressSelect({
    onChange,
    title,
    icon, 
}:
    {
        title: string,
        onChange: (userInfo: BitBadgesUserInfo) => void,
        icon?: React.ReactNode,
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
        <AddressModalDisplayTitle
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
                onChange={async (e) => {
                    e.preventDefault();
                    let bech32Address = '';
                    if (currUserInfo.chain === SupportedChain.ETH && ethers.utils.isAddress(e.target.value)) {
                        bech32Address = ethToCosmos(e.target.value);
                    } else if (currUserInfo.chain === SupportedChain.COSMOS && e.target.value.startsWith('cosmos')) {
                        bech32Address = e.target.value;
                    }

                    let accountNum = -1;
                    //TODO: better check for valid address so we do not spam getAccountInformation requests
                    if (bech32Address.startsWith('cosmos')) {
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
        <AddressModalDisplay
            userInfo={currUserInfo}
        />
        {/* TODO: invalid address  */}
    </>
}