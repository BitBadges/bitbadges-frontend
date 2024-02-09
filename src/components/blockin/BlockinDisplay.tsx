import { Avatar, Typography, notification } from "antd";
import { Numberify, SupportedChain } from "bitbadgesjs-sdk";
import { ChallengeParams, SignAndVerifyChallengeResponse, SupportedChainMetadata, constructChallengeObjectFromString } from 'blockin';
import { BlockinUIDisplay } from 'blockin/dist/ui';
import Image from 'next/image';
import { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';
import { DesiredNumberType, getSignInChallenge, signOut, verifySignIn } from "../../bitbadges-api/api";
import { SignChallengeResponse, useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { INFINITE_LOOP_MODE, SOLANA_LOGO, BITCOIN_LOGO } from "../../constants";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import { AddressDisplay } from "../address/AddressDisplay";
import { BlockiesAvatar } from "../address/Blockies";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";

const { Text } = Typography;

export const BlockinDisplay = ({
  hideLogo,
  hideLogin,
}: {
  hideLogo?: boolean;
  hideLogin?: boolean;
}) => {
  const {
    address,
    cosmosAddress,
    loggedIn,
    setLoggedIn,
    connect,
    disconnect,
    signChallenge,
    selectedChainInfo,
    chain,
    setChain,
    connected,
  } = useChainContext();

  const account = useAccount(address);
  const avatar = account?.profilePicUrl ?? account?.avatar;


  const [_cookies, setCookie] = useCookies(['blockincookie']);

  const [challengeParams, setChallengeParams] = useState<ChallengeParams<DesiredNumberType>>({
    domain: 'https://bitbadges.io',
    statement: 'Sign in to this website via Blockin. You will remain signed in until you terminate your browser session.',
    address: address ? address : 'Default Address',
    uri: 'https://bitbadges.io/login',
    nonce: 'Default Nonce'
  });

  /**
   * Update challengeParams when address or chain changes
   */
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: blockin display');
    async function updateChallengeParams() {
      if (address && connected) {
        const res = await getSignInChallenge({ chain, address });
        setChallengeParams(res.params);
      }
    }

    if (address && connected) {
      updateChallengeParams();
    }

  }, [address, chain, connected]);

  const handleSignChallenge = async (challenge: string) => {
    const response = await signChallenge(challenge);
    return response;
  }

  const handleVerifyChallenge = async (message: string, signature: string, publicKey?: string) => {

    try {
      await verifySignIn({ message, signature, publicKey });

      const _challengeObj = constructChallengeObjectFromString(message, Numberify);
      /**
       * At this point, the user has been verified by your backend and Blockin. Here, you will do anything needed
       * on the frontend to grant the user access such as setting loggedIn to true, adding cookies, or 
       * anything else that needs to be updated.
       */
      setLoggedIn(true);
      setCookie('blockincookie', cosmosAddress, { path: '/', expires: _challengeObj?.expirationDate ? new Date(_challengeObj.expirationDate) : undefined });
      return {
        success: true,
        message: 'Successfully signed in.',
      }
    } catch (e: any) {
      if (e.response.data) throw new Error(e.response.data.message);
      throw new Error(e.message);
    }
  }

  const signAndVerifyChallenge = async (challenge: string) => {

    const signChallengeResponse: SignChallengeResponse = await handleSignChallenge(challenge);
    //Check if error in challenge signature
    if (!signChallengeResponse.message || !signChallengeResponse.signature) {
      return { success: false, message: `${signChallengeResponse.message}` };
    }

    const verifyChallengeResponse: SignAndVerifyChallengeResponse = await handleVerifyChallenge(
      signChallengeResponse.message,
      signChallengeResponse.signature,
      signChallengeResponse.publicKey
    );

    return verifyChallengeResponse;
  }

  /**
  * This is where the chain details in ChainContext are updated upon a new chain being selected.
  */
  const handleUpdateChain = async (newChainMetadata: SupportedChainMetadata) => {
    if (newChainMetadata?.name) {
      setChain(newChainMetadata.name as SupportedChain);
    }
  }

  const logout = async () => {
    setLoggedIn(false);
    await signOut();
    setCookie('blockincookie', '', { path: '/' });
    const res = await getSignInChallenge({ chain, address });
    setChallengeParams(res.params);
  }

  return <>
    <div className='flex-center primary-text img-overrides' style={{ marginTop: 10 }}>
      {
        <BlockinUIDisplay
          connected={connected}
          connect={async () => {
            try {
              await connect();
            } catch (e: any) {
              console.error(e);
              notification.error({
                message: e.message,
                description: `Error connecting to wallet. ${e.message === 'User Rejected' ? 'This often occurs when you are not signed in to your wallet before attempting to connect.' : ''}`
              })
            }
          }}
          buttonStyle={{ height: 45 }}
          modalStyle={{ color: `white`, textAlign: 'start' }}
          disconnect={async () => {
            disconnect()
          }}
          chainOptions={[
            //These should match what ChainDrivers are implemented in your backend.
            { name: 'Ethereum' },
            { name: 'Cosmos' },
            {
              name: 'Solana',
              logo: SOLANA_LOGO,
              abbreviation: 'SOL',
              getAddressExplorerUrl: (address: string) => `https://explorer.solana.com/address/${address}`,
            },
            {
              name: 'Bitcoin',
              logo: BITCOIN_LOGO,
              abbreviation: 'BTC',
              getAddressExplorerUrl: (address: string) => `https://www.blockchain.com/btc/address/${address}`,
            }
          ]}

          address={address}
          selectedChainInfo={selectedChainInfo}
          onChainUpdate={handleUpdateChain}
          challengeParams={challengeParams}
          loggedIn={loggedIn}
          logout={async () => {
            await logout();
            setLoggedIn(false);
          }}
          selectedChainName={chain}
          displayedAssetGroups={[
            {
              assetConditionGroup: {
                assets: [{
                  collectionId: 1,
                  chain: 'BitBadges',
                  assetIds: [{ start: 9, end: 9 }],
                  ownershipTimes: [],
                  mustOwnAmounts: { start: 0, end: 0 },
                }],
              },
              name: 'General Access',
              description: <>To protect against known scammers and unwanted visitors, we do not allow access to this site if you have the scammer badge.,
                <div className="dark">
                  <BadgeAvatarDisplay
                    collectionId={1n}
                    badgeIds={[{ start: 9n, end: 9n }]}
                    size={100}
                    showSupplys
                    balance={[{
                      amount: 0n,
                      badgeIds: [{ start: 9n, end: 9n }],
                      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    }]}
                  /></div>
              </>,
              image: '/images/bitbadgeslogo.png',
              frozen: true,
              defaultSelected: true,
            },
          ]}
          signAndVerifyChallenge={signAndVerifyChallenge}
          hideConnectVsSignInHelper={hideLogin}
          maxTimeInFuture={168 * 60 * 60 * 1000} //1 week
        />
      }

    </div >
    {
      !hideLogo && <>
        <div>
          {!(hideLogo && !connected) &&
            <Avatar
              size={200}
              shape="square"
              className="rounded-lg"

              src={
                connected ? <BlockiesAvatar
                  avatar={avatar}
                  address={address.toLowerCase()}
                  fontSize={200}
                /> :
                  <Image src="/images/bitbadgeslogo.png" alt="BitBadges Logo" height={180} width={180} quality={100} />
              }
              style={{ marginTop: 40 }}
            />
          }
        </div>
        <div className='flex-center'> {connected &&
          <AddressDisplay
            addressOrUsername={address}
            fontSize={24}
          />}
        </div>
        <div> {connected && <Text
          strong
          className="primary-text"
          style={{ fontSize: 20 }}
        >
          {loggedIn ? 'Signed In' : 'Not Signed In'}
        </Text>}</div>
      </>
    }
  </>;
}