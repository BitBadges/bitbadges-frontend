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
}:
    {
        title: string,
        onChange: (userInfo: BitBadgesUserInfo) => void,
    }
) {
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({} as BitBadgesUserInfo);

    useEffect(() => {
        setCurrUserInfo({
            ...currUserInfo,
            cosmosAddress: '',
            accountNumber: -1,
        })

        let bech32Address = currUserInfo.address ? currUserInfo.address : '';
        if (currUserInfo.chain === SupportedChain.ETH && ethers.utils.isAddress(currUserInfo.address)) {
            bech32Address = ethToCosmos(currUserInfo.address);
        }

        //TODO: better check for valid address so we do not spam getAccountInformation requests
        if (bech32Address.startsWith('cosmos')) {
            getAccountInformation(bech32Address).then((accountInfo) => {
                const userInfo: BitBadgesUserInfo = {
                    chain: currUserInfo.chain,
                    address: currUserInfo.address,
                    cosmosAddress: bech32Address,
                    accountNumber: accountInfo.account_number,
                }

                setCurrUserInfo(userInfo);
                onChange({
                    accountNumber: accountInfo.account_number,
                    cosmosAddress: bech32Address,
                    chain: currUserInfo.chain,
                    address: currUserInfo.address,
                });
            });
        }
    }, [currUserInfo, setCurrUserInfo, onChange]);

    return <>
        <AddressModalDisplayTitle
            accountNumber={currUserInfo.accountNumber ? currUserInfo.accountNumber : -1}
            title={title}
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
                value={currUserInfo.address}
                onChange={(e) =>
                    setCurrUserInfo(
                        {
                            ...currUserInfo,
                            address: e.target.value,
                        }
                    )
                }
            />
        </Input.Group>
        <AddressModalDisplay
            userInfo={currUserInfo}
        />
        {/* TODO: invalid address  */}
    </>
}