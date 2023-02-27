import { Dropdown, Input } from 'antd';
import { COSMOS } from 'bitbadgesjs-address-converter';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { convertToCosmosAddress, getChainForAddress, isAddressValid } from '../../bitbadges-api/chains';
import { BitBadgesUserInfo } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { AddressDisplay } from './AddressDisplay';
import { SearchDropdown } from '../navigation/SearchDropdown';

export enum EnterMethod {
    Single = 'Single',
    Batch = 'Batch',
}

export function AddressSelect({
    currUserInfo,
    setCurrUserInfo,
    fontColor,
    darkMode,
    hideAddressDisplay
}: {
    currUserInfo: BitBadgesUserInfo,
    setCurrUserInfo: (currUserInfo: BitBadgesUserInfo) => void,
    fontColor?: string,
    darkMode?: boolean,
    hideAddressDisplay?: boolean
}) {
    const accounts = useAccountsContext();

    return <>
        <br />
        <Input.Group compact style={{ display: 'flex' }}>
            <Dropdown
                open={currUserInfo && currUserInfo.address !== '' && !isAddressValid(currUserInfo.address)}
                placement="bottom"
                overlay={<SearchDropdown onlyAddresses searchValue={currUserInfo.address} onSearch={(searchValue: string) => {
                    setCurrUserInfo(accounts.accounts[accounts.cosmosAddresses[searchValue]]);
                }} />}
                trigger={['hover', 'click']}
            >
                <Input
                    value={currUserInfo.address}
                    style={darkMode ? {
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT
                    } : undefined}
                    onChange={async (e) => {
                        e.preventDefault();
                        const bech32Address = convertToCosmosAddress(e.target.value)
                        const chain = getChainForAddress(e.target.value);

                        setCurrUserInfo({
                            chain: chain,
                            address: e.target.value,
                            cosmosAddress: bech32Address,
                            accountNumber: -1,
                        });


                        //Try and get account number; if still -1, we assume accont is unregistered still
                        let accountNum = -1;
                        try {
                            COSMOS.decoder(bech32Address); //throws on decode error, so we don't spam getAccountInformation with invalid addresses
                            const acctInformation = await accounts.fetchAccounts([bech32Address]);
                            accountNum = acctInformation[0].accountNumber;
                        } catch (err) {

                        }


                        setCurrUserInfo({
                            chain: chain,
                            address: e.target.value,
                            cosmosAddress: bech32Address,
                            accountNumber: accountNum,
                        });
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