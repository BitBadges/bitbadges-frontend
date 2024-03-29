import { Spin, Tooltip, Typography } from 'antd';
import {
  SupportedChain,
  convertToBtcAddress,
  convertToCosmosAddress,
  convertToEthAddress,
  getAbbreviatedAddress,
  getChainForAddress,
  isAddressValid
} from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from './AddressDisplay';

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
  const userInfo = useAccount(addressOrUsername);

  let newAddress = '';
  if (userInfo && overrideChain != null && userInfo?.chain !== overrideChain) {
    if (overrideChain === SupportedChain.BTC) newAddress = userInfo.btcAddress;
    else if (overrideChain === SupportedChain.ETH) newAddress = userInfo.ethAddress;
    else if (overrideChain === SupportedChain.COSMOS) newAddress = userInfo.cosmosAddress;
  }

  const addressName = !doNotShowName ? userInfo?.username : '';
  const resolvedName = !doNotShowName ? userInfo?.resolvedName : '';
  const address = (overrideChain != null ? newAddress : userInfo?.address) || addressOrUsername || '';
  const chain = overrideChain ?? userInfo?.chain;

  const isValidAddress = isAddressValid(address) || address == 'All';
  const displayAddress = addressName ? addressName : resolvedName ? resolvedName : getAbbreviatedAddress(address);

  const innerContent =
    !hideTooltip && userInfo ? (
      <Tooltip
        placement="bottom"
        color="black"
        title={
          <>
            <div className="dark">
              {address === 'Mint' ? (
                <div
                  className="primary-text"
                  style={{
                    textAlign: 'center'
                  }}
                >
                  This is a special escrow address used when badges are first created. Badges can only be transferred from this address, not to it.
                </div>
              ) : address == 'All' ? (
                <div
                  className="primary-text"
                  style={{
                    textAlign: 'center'
                  }}
                >
                  This represents all possible user addresses.
                </div>
              ) : (
                <div
                  className="primary-text"
                  style={{
                    textAlign: 'center'
                  }}
                >
                  {`${chain} Address`}
                  {resolvedName ? (
                    <>
                      <br />
                      {`${resolvedName}`}
                    </>
                  ) : (
                    ''
                  )}

                  <br />
                  <br />
                  {`${address}`}
                  <br />
                  <br />
                  {userInfo.alias || userInfo.cosmosAddress.length > 45 ? (
                    <>
                      <div className="flex-center">
                        This is a reserved alias account. It is not a real account and cannot initiate transactions. However, it has a portfolio and
                        can receive badges.
                      </div>
                    </>
                  ) : (
                    <>
                      {'Other equivalent addresses: '}
                      <br />
                      {!doNotShowName && (addressName || resolvedName) && (
                        <div className="flex-center">
                          <AddressDisplay addressOrUsername={address} hidePortfolioLink hideTooltip doNotShowName />
                          <br />
                        </div>
                      )}
                      {getChainForAddress(address) === SupportedChain.ETH && isAddressValid(address) && (
                        <div className="flex-center flex-column">
                          <AddressDisplay
                            addressOrUsername={convertToCosmosAddress(address)}
                            overrideChain={SupportedChain.COSMOS}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                          <AddressDisplay
                            addressOrUsername={convertToBtcAddress(address)}
                            overrideChain={SupportedChain.BTC}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                        </div>
                      )}

                      {getChainForAddress(address) === SupportedChain.COSMOS && isAddressValid(address) && (
                        <div className="flex-center flex-column">
                          <AddressDisplay
                            addressOrUsername={convertToEthAddress(address)}
                            overrideChain={SupportedChain.ETH}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                          <AddressDisplay
                            addressOrUsername={convertToBtcAddress(address)}
                            overrideChain={SupportedChain.BTC}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                        </div>
                      )}

                      {getChainForAddress(address) === SupportedChain.BTC && isAddressValid(address) && (
                        <div className="flex-center flex-column">
                          <AddressDisplay
                            addressOrUsername={convertToEthAddress(address)}
                            overrideChain={SupportedChain.ETH}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                          <AddressDisplay
                            addressOrUsername={convertToCosmosAddress(address)}
                            overrideChain={SupportedChain.COSMOS}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                        </div>
                      )}

                      {getChainForAddress(address) !== SupportedChain.SOLANA && isAddressValid(address) && userInfo.solAddress && (
                        <div className="flex-center flex-column">
                          <AddressDisplay
                            addressOrUsername={userInfo.solAddress}
                            overrideChain={SupportedChain.SOLANA}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                        </div>
                      )}
                      {getChainForAddress(address) === SupportedChain.SOLANA && isAddressValid(address) && (
                        <div className="flex-center flex-column">
                          <AddressDisplay
                            addressOrUsername={convertToCosmosAddress(address)}
                            overrideChain={SupportedChain.COSMOS}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                          <AddressDisplay
                            addressOrUsername={convertToBtcAddress(address)}
                            overrideChain={SupportedChain.BTC}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                        </div>
                      )}
                      {getChainForAddress(address) === SupportedChain.SOLANA && isAddressValid(address) && (
                        <div className="flex-center">
                          <AddressDisplay
                            addressOrUsername={convertToEthAddress(address)}
                            overrideChain={SupportedChain.ETH}
                            hidePortfolioLink
                            hideTooltip
                            doNotShowName
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        }
        overlayStyle={{
          minWidth: 320
        }}
      >
        {displayAddress}
      </Tooltip>
    ) : (
      displayAddress
    );

  const showLink = !hidePortfolioLink && address && address !== 'Mint' && address != 'All';
  const invalidAddress = !isValidAddress;

  return (
    <div>
      <div
        style={{
          verticalAlign: 'middle',
          paddingLeft: 5,
          fontSize: fontSize
        }}
        className="whitespace-nowrap"
      >
        <Text
          className={'primary-text ' + (!showLink ? '' : ' link-button-nav')}
          onClick={
            !showLink
              ? undefined
              : () => {
                  router.push(`/account/${address}`);
                }
          }
          copyable={{
            text: address,
            tooltips: ['Copy Address', 'Copied!']
          }}
          style={{
            color: invalidAddress ? 'red' : fontColor,
            display: 'inline-flex'
          }}
        >
          <b>{userInfo ? <>{innerContent}</> : !invalidAddress ? <Spin /> : <>{displayAddress}</>}</b>
        </Text>
      </div>
    </div>
  );
}
