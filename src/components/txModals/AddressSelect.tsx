import React, { useEffect, useState } from 'react';
import { Typography, Input, Select, Form } from 'antd';
import { SupportedChain } from '../../bitbadges-api/types';
import { ethToCosmos, } from 'bitbadgesjs-address-converter';
import { ethers } from 'ethers';
import { getAccountInformation } from '../../bitbadges-api/api';
import Blockies from 'react-blockies';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';
import { AddressModalDisplay, AddressModalDisplayTitle } from './AddressModalDisplay';

const { Option } = Select;
const { Text } = Typography;

export function AddressSelect({
    onChange
}:
    {
        onChange: (cosmosAddress: string, accountNumber: number) => void,
    }
) {
    const [chain, setChain] = useState<SupportedChain>(SupportedChain.ETH);
    const [address, setAddress] = useState<string>('');
    const [cosmosAddress, setCosmosAddress] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<number>();

    useEffect(() => {
        setCosmosAddress('');
        setAccountNumber(undefined);
        let bech32Address = address;
        if (chain === SupportedChain.ETH && ethers.utils.isAddress(address)) {
            bech32Address = ethToCosmos(address);
        }

        //TODO: better check for valid address so we do not spam getAccountInformation requests
        if (bech32Address.startsWith('cosmos')) {
            getAccountInformation(bech32Address).then((accountInfo) => {
                setAccountNumber(accountInfo.account_number);
                setCosmosAddress(bech32Address);
                onChange(bech32Address, accountInfo.account_number);
            });
        }
    }, [address, chain, setAccountNumber, onChange]);

    return <>
        <AddressModalDisplayTitle
            accountNumber={accountNumber ? accountNumber : -1}
            title="New Manager"
        />
        <Input.Group compact style={{ display: 'flex' }}>
            <Select
                value={chain}
                onSelect={(e: any) =>
                    setChain(e)
                }
                defaultValue={SupportedChain.ETH}
            >
                <Option value={SupportedChain.ETH}>Ethereum</Option>
                <Option value={SupportedChain.COSMOS}>Cosmos</Option>
            </Select>
            <Input
                value={address}
                onChange={(e) =>
                    setAddress(
                        e.target.value
                    )
                }
            />
        </Input.Group>
        <AddressModalDisplay
            accountNumber={accountNumber ? accountNumber : -1}
            address={address}
            cosmosAddress={cosmosAddress}
            chain={chain}
        />
        {/* <div
            style={{
                width: '100%',
                display: 'flex',
            }}
        >
            <Form
                layout="horizontal"
            >
                <Form.Item>
                    <Text>
                        Cosmos: {
                            chain === SupportedChain.ETH
                                && ethers.utils.isAddress(address) ?
                                ethToCosmos(address) :
                                'Invalid Address'
                        }
                    </Text>
                    <br />
                    <Text>
                        Account Number: {
                            chain === SupportedChain.ETH
                                && ethers.utils.isAddress(address) ?
                                accountNumber :
                                'N/A'
                        }
                    </Text>
                </Form.Item>
            </Form>
        </div> */}
    </>
}