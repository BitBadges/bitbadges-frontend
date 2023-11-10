import { Spin, Tooltip, Typography } from 'antd';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import { BigIntify, MINT_ACCOUNT, SupportedChain, convertBitBadgesUserInfo, convertToCosmosAddress, getAbbreviatedAddress, getChainForAddress, isAddressValid } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';

import { AddressDisplay } from './AddressDisplay';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';

const { Text } = Typography;

export function Address({
  addressOrUsername,
  fontSize = 16,
  fontColor,
  hideTooltip,
  hidePortfolioLink,
  overrideChain,
  doNotShowName
}: {
  addressOrUsername: string;
  fontSize?: number | string;
  fontColor?: string;
  hideTooltip?: boolean;
  hidePortfolioLink?: boolean;
  overrideChain?: SupportedChain;
  doNotShowName?: boolean;
}) {
  const router = useRouter();


  const chainContext = useChainContext();
  const fetchedAccount = useAccount(addressOrUsername);

  const userInfo = fetchedAccount ? convertBitBadgesUserInfo({
    ...fetchedAccount,
    address: chainContext.cosmosAddress == fetchedAccount.address ? chainContext.address : fetchedAccount.address,
    chain: chainContext.cosmosAddress == fetchedAccount.address ? chainContext.chain : fetchedAccount.chain
  }, BigIntify) : undefined; //deep copy

  let newAddress = '';
  if (userInfo && overrideChain && userInfo?.chain !== overrideChain && overrideChain === SupportedChain.COSMOS) {
    newAddress = userInfo.cosmosAddress;
  } else if (userInfo && overrideChain && userInfo?.chain !== overrideChain) {
    newAddress = cosmosToEth(userInfo.cosmosAddress);
  }


  const addressName = !doNotShowName ? userInfo?.username : '';
  const resolvedName = !doNotShowName ? userInfo?.resolvedName : '';
  let address = (overrideChain ? newAddress : userInfo?.address) || addressOrUsername || '';
  let chain = overrideChain ?? userInfo?.chain;

  const isValidAddress = isAddressValid(address) || address == 'All' || address == 'All Other';
  const displayAddress = addressName ? addressName : getChainForAddress(address) === SupportedChain.ETH && chain === SupportedChain.ETH && resolvedName && resolvedName.endsWith('.eth') ? resolvedName : getAbbreviatedAddress(address);

  const innerContent = !hideTooltip && userInfo ? (
    <Tooltip
      placement="bottom"
      color='black'
      title={
        <>
          <div className='dark'>{
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
                  This represents all possible user addresses.
                </div> :
                <div
                  className='primary-text'
                  style={{
                    textAlign: 'center',
                  }}
                >
                  {`${chain} Address`}
                  {resolvedName ? <><br />{`${resolvedName}`}</> : ''}

                  <br />
                  <br />
                  {`${address}`}
                  <br />
                  <br />

                  {"Other equivalent addresses: "}
                  <br />
                  {!doNotShowName && (addressName || resolvedName) && <div className='flex-center'>
                    <AddressDisplay
                      addressOrUsername={address}
                      hidePortfolioLink
                      hideTooltip
                      doNotShowName
                    />
                    <br />
                  </div>}
                  {getChainForAddress(address) === SupportedChain.ETH && isAddressValid(address) && <div className='flex-center'>
                    <AddressDisplay
                      addressOrUsername={convertToCosmosAddress(address)}
                      overrideChain={SupportedChain.COSMOS}
                      hidePortfolioLink
                      hideTooltip
                      doNotShowName
                    />
                    <br />
                  </div>}
                  {getChainForAddress(address) === SupportedChain.COSMOS && isAddressValid(address) && <div className='flex-center'>
                    <AddressDisplay
                      addressOrUsername={cosmosToEth(address)}
                      overrideChain={SupportedChain.ETH}
                      hidePortfolioLink
                      hideTooltip
                      doNotShowName
                    />
                    <br />
                  </div>}
                </div>
          }</div>
        </>
      }
      overlayStyle={{
        minWidth: 320,

      }}
    >
      {displayAddress}
    </Tooltip>
  ) : (
    displayAddress
  );

  const showLink = !hidePortfolioLink && address && address !== MINT_ACCOUNT.address && address != 'All' && address != 'All Other';
  const invalidAddress = !isValidAddress;

  console.log(address, fontColor);
  return (
    <div style={{}}>
      <div
        style={{
          verticalAlign: 'middle',
          paddingLeft: 5,
          fontSize: fontSize,
        }}
        className='whitespace-nowrap'
      >
        <Text
          className={'primary-text ' + (!showLink ? '' : ' link-button-nav')}

          onClick={!showLink ? undefined : () => {
            router.push(`/account/${address}`);
          }}

          copyable={{
            text: address,
            tooltips: ['Copy Address', 'Copied!'],
          }}
          style={{
            color: invalidAddress ? 'red' : fontColor,
            display: 'inline-flex',
          }}
        >
          <b>
            {userInfo ? <>{innerContent}</> : !invalidAddress ? <Spin /> : <>{displayAddress}</>}
          </b>
        </Text>
      </div>
    </div>
  );
}
