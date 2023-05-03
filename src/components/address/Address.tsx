import { Modal, Tooltip, Typography } from 'antd';
import { cosmosToEth, ethToCosmos } from 'bitbadgesjs-address-converter';
import { BitBadgesUserInfo, MINT_ACCOUNT, SupportedChain, getAbbreviatedAddress, getChainForAddress, isAddressValid } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { PRIMARY_TEXT } from '../../constants';
import { AddressDisplay } from './AddressDisplay';

const { Text } = Typography;

export function Address({
  userInfo,
  fontSize,
  fontColor,
  hideTooltip,
  hidePortfolioLink,
}: {
  userInfo: BitBadgesUserInfo;
  fontSize?: number | string;
  fontColor?: string;
  hideTooltip?: boolean;
  hidePortfolioLink?: boolean
}) {
  const addressName = userInfo?.name;
  const resolvedName = userInfo?.name;
  const address = userInfo?.address || '';
  const accountNumber = userInfo?.accountNumber || -1;

  const router = useRouter();
  const chain = getChainForAddress(address);

  const displayAddress = addressName ? addressName : getAbbreviatedAddress(address);
  const isValidAddress = isAddressValid(address);

  const innerContent = !hideTooltip ? (
    <Tooltip
      placement="bottom"
      color='black'
      title={
        address === MINT_ACCOUNT.address ? <div style={{
          textAlign: 'center',
          color: PRIMARY_TEXT,
          minWidth: 360
        }}>
          This is a special address used when badges are minted.
        </div>
          :
          <div style={{
            textAlign: 'center',
            color: PRIMARY_TEXT,
            minWidth: 360
          }}>
            {`${getChainForAddress(address)} Address${accountNumber && accountNumber !== -1 ? ` (ID #${accountNumber})` : ``}`}
            <br />
            {`${resolvedName ? resolvedName : ''}`}

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
                  ...userInfo,
                  address: ethToCosmos(address),
                  cosmosAddress: ethToCosmos(address),
                  chain: SupportedChain.COSMOS,

                }}
                hidePortfolioLink
                hideTooltip
              />
              <br />
            </div>}
            {chain === SupportedChain.COSMOS && isAddressValid(address) && <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AddressDisplay
                darkMode
                userInfo={{
                  ...userInfo,
                  address: cosmosToEth(address),
                  cosmosAddress: address,
                  chain: SupportedChain.ETH,
                }}
                hidePortfolioLink
                hideTooltip
              />
              <br />
            </div>}

          </div>
      }
      overlayStyle={{
        minWidth: 360
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
            copyable={{ text: address, tooltips: ['Copy Address', 'Copied!'] }}
            style={{
              color: !isValidAddress ? 'red' : fontColor
            }}
            className={hidePortfolioLink ? undefined : 'link-button-nav'}
            strong
            onClick={hidePortfolioLink ? undefined : () => {
              router.push(`/account/${address}`);
              Modal.destroyAll()
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
              Modal.destroyAll()
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
