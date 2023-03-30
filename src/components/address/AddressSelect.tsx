import { Dropdown, Input } from 'antd';
import { COSMOS } from 'bitbadgesjs-address-converter';
import { useState } from 'react';
import { convertToCosmosAddress, getChainForAddress } from '../../bitbadges-api/chains';
import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { SearchDropdown } from '../navigation/SearchDropdown';
import { AddressDisplay } from './AddressDisplay';

export enum EnterMethod {
    Single = 'Single',
    Batch = 'Batch',
}

export function AddressSelect({
    currUserInfo,
    setCurrUserInfo,
    fontColor,
    darkMode,
    hideAddressDisplay,
    isListSelect
}: {
    currUserInfo: BitBadgesUserInfo,
    setCurrUserInfo: (currUserInfo: BitBadgesUserInfo) => void,
    fontColor?: string,
    darkMode?: boolean,
    hideAddressDisplay?: boolean
    isListSelect?: boolean
}) {
    const accounts = useAccountsContext();

    const [input, setInput] = useState<BitBadgesUserInfo>(currUserInfo);
    const [inputHasChanged, setInputHasChanged] = useState<boolean>(false);


    return <>
        <br />
        <Input.Group compact style={{ display: 'flex' }}>
            <Dropdown
                open={input && input.address !== '' && inputHasChanged}
                placement="bottom"
                overlay={
                    <SearchDropdown
                        onlyAddresses
                        searchValue={input.address}
                        onSearch={(searchValue: string) => {
                            setCurrUserInfo(accounts.accounts[accounts.cosmosAddresses[searchValue]]);

                            if (isListSelect) {
                                setInput({
                                    chain: SupportedChain.UNKNOWN,
                                    address: '',
                                    cosmosAddress: '',
                                    accountNumber: -1
                                });
                            } else {
                                setInputHasChanged(false);
                                setInput(accounts.accounts[accounts.cosmosAddresses[searchValue]]);
                            }
                        }} />
                }
                trigger={['hover', 'click']}
            >
                <Input
                    value={input.name ? input.name : input.address}
                    style={darkMode ? {
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT
                    } : undefined}
                    onChange={async (e) => {
                        e.preventDefault();
                        setInputHasChanged(true);

                        const bech32Address = convertToCosmosAddress(e.target.value)
                        const chain = getChainForAddress(e.target.value);

                        //Initial update w/o account number and name
                        setInput({
                            chain: chain,
                            address: e.target.value,
                            cosmosAddress: bech32Address,
                            accountNumber: -1,
                            name: ''
                        });

                        //Try and get account number and name; if acctNum still -1, we assume accont is unregistered still
                        let accountNum = -1;
                        let name = '';
                        try {
                            COSMOS.decoder(bech32Address); //throws on decode error, so we don't spam getAccountInformation with invalid addresses
                            const acctInformation = await accounts.fetchAccounts([bech32Address]);
                            accountNum = acctInformation[0].accountNumber;
                            name = acctInformation[0].name ? acctInformation[0].name : '';
                            setInput({
                                chain: chain,
                                address: e.target.value,
                                cosmosAddress: bech32Address,
                                accountNumber: accountNum,
                                name
                            });
                        } catch (err) {

                        }
                    }}
                />
            </Dropdown>
        </Input.Group>
        {!hideAddressDisplay && <div>
            <br />
            <AddressDisplay
                userInfo={currUserInfo}
                fontColor={fontColor}
                showAccountNumber
                darkMode
            />
        </div>}
    </>
}