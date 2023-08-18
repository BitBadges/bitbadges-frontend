import { Spin, Tooltip, Typography } from 'antd';
import { MINT_ACCOUNT, SupportedChain, convertToCosmosAddress, getAbbreviatedAddress, getChainForAddress, isAddressValid } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { AddressDisplay } from './AddressDisplay';
import { cosmosToEth } from 'bitbadgesjs-address-converter';

const { Text } = Typography;

export function Address({
  addressOrUsername,
  fontSize = 20,
  fontColor,
  hideTooltip,
  hidePortfolioLink,
  overrideChain,
}: {
  addressOrUsername: string;
  fontSize?: number | string;
  fontColor?: string;
  hideTooltip?: boolean;
  hidePortfolioLink?: boolean;
  overrideChain?: SupportedChain;
}) {
  const router = useRouter();
  const accounts = useAccountsContext();
  const userInfo = accounts.getAccount(addressOrUsername);

  let newAddress = '';
  if (userInfo && overrideChain && userInfo?.chain !== overrideChain && overrideChain === SupportedChain.COSMOS) {
    newAddress = userInfo.cosmosAddress;
  } else if (userInfo && overrideChain && userInfo?.chain !== overrideChain) {
    newAddress = cosmosToEth(userInfo.cosmosAddress);
  }


  const addressName = userInfo?.username;
  const resolvedName = userInfo?.resolvedName;
  let address = (overrideChain ? newAddress : userInfo?.address) || addressOrUsername || '';
  let chain = overrideChain ?? userInfo?.chain;

  const isValidAddress = isAddressValid(address) || address == 'All' || address == 'All Other';
  const displayAddress = addressName ? addressName : getChainForAddress(address) === SupportedChain.ETH && chain === SupportedChain.ETH && resolvedName && resolvedName.endsWith('.eth') ? resolvedName : getAbbreviatedAddress(address);

  const innerContent = !hideTooltip && userInfo ? (
    <Tooltip
      placement="bottom"
      color='black'
      title={
        address === MINT_ACCOUNT.address ?
          <div
            className='primary-text'
            style={{
              textAlign: 'center',
            }}
          >
            This is a special escrow address used when badges are first created. Badges can only be transferred from this address, not to it.
          </div> : address == "All" ?
            <div
              className='primary-text'
              style={{
                textAlign: 'center',
              }}
            >
              This represents all addresses that are not already handled in this list.
            </div> :
            <div
              className='primary-text'
              style={{
                textAlign: 'center',
              }}
            >
              {`${chain} Address`}
              {resolvedName ? <><br />{`(${resolvedName})`}</> : ''}
              <br />
              <br />
              {`${address}`}
              <br />
              <br />

              {"Other equivalent addresses include: "}
              <br />
              {chain === SupportedChain.ETH && isAddressValid(address) && <div className='flex-center'>
                <AddressDisplay
                  addressOrUsername={convertToCosmosAddress(address)}
                  overrideChain={SupportedChain.COSMOS}
                  hidePortfolioLink
                  hideTooltip
                />
                <br />
              </div>}
              {chain === SupportedChain.COSMOS && isAddressValid(address) && <div className='flex-center'>
                <AddressDisplay
                  addressOrUsername={cosmosToEth(address)}
                  overrideChain={SupportedChain.ETH}
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

  const showLink = !hidePortfolioLink && address && address !== MINT_ACCOUNT.address && address != 'All' && address != 'All Other';
  const invalidAddress = !isValidAddress;
  return (
    <div className='flex-center'>
      <div
        style={{
          verticalAlign: 'middle',
          paddingLeft: 5,
          fontSize: fontSize,
        }}
      >
        <Text
          className={!showLink ? undefined : 'link-button-nav'}
          strong
          onClick={!showLink ? undefined : () => {
            router.push(`/account/${address}`);
          }}
          
          copyable={{
            text: address,
            tooltips: ['Copy Address', 'Copied!'],
          }}
          style={{
            color: invalidAddress ? 'red' : fontColor,
          }}
        >
          {userInfo ? <>{innerContent}</> : !invalidAddress ? <Spin /> : <>{displayAddress}</>}

        </Text>
      </div>
    </div>
  );
}
