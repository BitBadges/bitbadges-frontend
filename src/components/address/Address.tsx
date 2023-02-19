import { IdcardOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import { useRouter } from 'next/router';
import { getAbbreviatedAddress, isAddressValid } from '../../bitbadges-api/chains';

const { Text } = Typography;

export function Address({
    address,
    chain,
    fontSize,
    fontColor,
    hideTooltip,
    accountNumber,
    hidePortfolioLink,
}: {
    address: string;
    chain: string;
    blockExplorer?: string;
    size?: string;
    fontSize?: number | string;
    fontColor?: string;
    hideTooltip?: boolean;
    accountNumber?: number,
    hidePortfolioLink?: boolean
}) {
    const router = useRouter();

    let displayAddress = getAbbreviatedAddress(address);
    let isValidAddress = isAddressValid(address, chain);

    const innerContent = !hideTooltip ? (
        <Tooltip
            placement="bottom"
            title={
                <div style={{
                    textAlign: 'center',
                }}>
                    {`${chain} Address${accountNumber && accountNumber !== -1 ? ` (BitBadges ID #${accountNumber})` : ``}`}
                    <br />
                    <br />
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
                        strong
                    >
                        {innerContent}
                        {!hidePortfolioLink && <Tooltip title="Go to Portfolio">
                            <a>
                                <IdcardOutlined
                                    style={{ marginLeft: 4 }}
                                    onClick={() => {
                                        router.push(`/account/${address}`);
                                    }}
                                />
                            </a>
                        </Tooltip>}
                    </Text>
                ) : (
                    <Text
                        copyable={true}
                        style={{
                            color: fontColor ? fontColor : undefined,
                        }}
                        strong
                    >
                        {innerContent}
                    </Text>
                )}
            </div>
        </div>
    );
}
