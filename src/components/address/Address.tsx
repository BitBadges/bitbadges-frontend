import { Popover, Tooltip, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useAccountsContext } from '../../accounts/AccountsContext';
import { getAbbreviatedAddress, isAddressValid } from '../../bitbadges-api/chains';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { SupportedChain } from '../../bitbadges-api/types';
import { AddressDisplay } from './AddressDisplay';
import { ethToCosmos } from 'bitbadgesjs-address-converter';

const { Text } = Typography;

export function Address({
    address,
    chain,
    fontSize,
    fontColor,
    hideTooltip,
    hidePortfolioLink,
    addressName
}: {
    address: string;
    chain: string;
    blockExplorer?: string;
    size?: string;
    fontSize?: number | string;
    fontColor?: string;
    hideTooltip?: boolean;
    hidePortfolioLink?: boolean
    addressName?: string
}) {
    const router = useRouter();
    const accounts = useAccountsContext();

    let displayAddress = addressName ? addressName : getAbbreviatedAddress(address);
    let isValidAddress = isAddressValid(address, chain);
    const accountNumber = accounts.accountNumbers[address];

    const innerContent = !hideTooltip ? (
        <Tooltip
            placement="bottom"
            color='black'
            title={
                <div style={{
                    textAlign: 'center',
                    color: PRIMARY_TEXT,
                    minWidth: 400
                }}>
                    {`${chain} Address${accountNumber && accountNumber !== -1 ? ` (ID #${accountNumber})` : ``}`}
                    <br />
                    <br />
                    {`${address}`}
                    <br />
                    <br />

                    {"Other equivalent addresses include: "}
                    <br />
                    {chain === SupportedChain.ETH && isAddressValid(address) && <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <AddressDisplay
                            darkMode
                            userInfo={{
                                address: ethToCosmos(address),
                                cosmosAddress: ethToCosmos(address),
                                chain: SupportedChain.COSMOS,
                                accountNumber: -1,
                            }}
                            hidePortfolioLink
                            hideTooltip
                        />
                        <br />
                    </div>
                    }

                </div>
            }
            overlayStyle={{
                minWidth: 400
            }}
        >
            {displayAddress}
        </Tooltip>
    ) : (
        displayAddress
    );


    return (
        <div>
            <div
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
                            color: !isValidAddress ? 'red' : fontColor
                        }}
                        className={hidePortfolioLink ? undefined : 'link-button-nav'}
                        strong
                        onClick={hidePortfolioLink ? undefined : () => {
                            router.push(`/account/${address}`);
                        }}
                    >
                        {innerContent}
                    </Text>
                ) : (
                    <Text
                        className={hidePortfolioLink ? undefined : 'link-button-nav'}
                        strong
                        onClick={hidePortfolioLink ? undefined : () => {
                            router.push(`/account/${address}`);
                        }}
                        copyable={true}
                        style={{
                            color: fontColor ? fontColor : undefined,
                        }}
                    >
                        {innerContent}
                    </Text>
                )}
            </div>
        </div>
    );
}
