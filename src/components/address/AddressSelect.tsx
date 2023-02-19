import { Input } from 'antd';
import { COSMOS } from 'bitbadgesjs-address-converter';
import { getAccountInformation } from '../../bitbadges-api/api';
import { convertToCosmosAddress, getChainForAddress } from '../../bitbadges-api/chains';
import { BitBadgesUserInfo } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
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
}: {
    currUserInfo: BitBadgesUserInfo,
    setCurrUserInfo: (currUserInfo: BitBadgesUserInfo) => void,
    fontColor?: string,
    darkMode?: boolean,
}) {
    return <>
        <br />
        <Input.Group compact style={{ display: 'flex' }}>
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

                    //TODO: I uncommented this out to test (maybe add a loading spinner?)
                    // setCurrUserInfo({
                    //     chain: chain,
                    //     address: e.target.value,
                    //     cosmosAddress: bech32Address,
                    //     accountNumber: -1,
                    // });


                    //Try and get account number; if still -1, we assume accont is unregistered still
                    let accountNum = -1;
                    try {
                        COSMOS.decoder(bech32Address); //throws on decode error, so we don't spam getAccountInformation with invalid addresses
                        const acctInformation = await getAccountInformation(bech32Address);
                        accountNum = acctInformation.account_number;
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
        </Input.Group>
        <br />
        <AddressDisplay
            userInfo={currUserInfo}
            fontColor={fontColor}
            showAccountNumber
        />
    </>
}