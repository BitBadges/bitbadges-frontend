import { Avatar, Spin, Typography, notification } from "antd";
import { BigIntify } from "bitbadgesjs-proto";
import { SupportedChain } from "bitbadgesjs-utils";
import { ChallengeParams, SignAndVerifyChallengeResponse, SupportedChainMetadata, constructChallengeObjectFromString } from 'blockin';
import { BlockinUIDisplay } from 'blockin/dist/ui';
import Image from 'next/image';
import { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';
import { DesiredNumberType, getSignInChallenge, signOut, verifySignIn } from "../../bitbadges-api/api";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { SignChallengeResponse, useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressDisplay } from "../address/AddressDisplay";
import { BlockiesAvatar } from "../address/Blockies";

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
  const accounts = useAccountsContext();
  const account = accounts.getAccount(address);
  const avatar = account?.profilePicUrl ?? account?.avatar;


  const [_cookies, setCookie] = useCookies(['blockincookie']);
  const [loading, setLoading] = useState<boolean>(true);

  const [challengeParams, setChallengeParams] = useState<ChallengeParams<DesiredNumberType>>({
    domain: 'https://blockin.com',
    statement: 'Sign in to this website via Blockin. You will remain signed in until you terminate your browser session.',
    address: address ? address : 'Default Address',
    uri: 'https://blockin.com/login',
    nonce: 'Default Nonce'
  });

  /**
   * Update challengeParams when address or chain changes
   */
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: blockin display');
    async function updateChallengeParams() {
      if (address) {
        const res = await getSignInChallenge({ chain, address });
        setChallengeParams(res.params);
      }
    }

    if (address) {
      updateChallengeParams();
    }
  }, [address, chain]);

  const handleSignChallenge = async (challenge: string) => {
    const response = await signChallenge(challenge);
    return response;
  }

  const handleVerifyChallenge = async (originalBytes: Uint8Array, signatureBytes: Uint8Array, _challengeObj?: ChallengeParams<DesiredNumberType>) => {

    try {
      const verificationResponse = await verifySignIn({ chain, originalBytes, signatureBytes });


      /**
       * At this point, the user has been verified by your backend and Blockin. Here, you will do anything needed
       * on the frontend to grant the user access such as setting loggedIn to true, adding cookies, or 
       * anything else that needs to be updated.
       */
      setLoggedIn(true);
      setCookie('blockincookie', cosmosAddress, { path: '/', expires: _challengeObj?.expirationDate ? new Date(_challengeObj.expirationDate) : undefined });
      return {
        success: true, message: `${verificationResponse.successMessage}`
      }
    } catch (e: any) {
      if (e.response.data) throw new Error(e.response.data.message);
      throw new Error(e.message);
    }
  }

  const signAndVerifyChallenge = async (challenge: string) => {

    setLoading(true);

    const signChallengeResponse: SignChallengeResponse = await handleSignChallenge(challenge);
    //Check if error in challenge signature
    if (!signChallengeResponse.originalBytes || !signChallengeResponse.signatureBytes) {
      return { success: false, message: `${signChallengeResponse.message}` };
    }
    const verifyChallengeResponse: SignAndVerifyChallengeResponse = await handleVerifyChallenge(
      signChallengeResponse.originalBytes,
      signChallengeResponse.signatureBytes,
      constructChallengeObjectFromString(challenge, BigIntify)
    );

    setLoading(false);

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
    <div className='flex-center' style={{ color: 'black' }}>
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

          buttonStyle={{ minWidth: 90, }}
          modalStyle={{ color: `black`, backgroundColor: `white` }}
          disconnect={async () => {
            disconnect()
          }}
          hideChainName={true}
          chainOptions={[
            //These should match what ChainDrivers are implemented in your backend.
            { name: 'Ethereum' },
            // { name: 'Algorand Testnet', },
            // { name: 'Algorand Mainnet', },
            // { name: 'Polygon' },
            // { name: 'Avalanche' },
            { name: 'Cosmos' },
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
          displayedAssets={[
            // {
            //   collectionId: 2,
            //   chain: 'BitBadges',
            //   assetIds: [{ start: 1, end: 10 }],
            //   mustOwnAmounts: { start: 0, end: 0 },
            //   // ownershipTimes: [{ start: 1, end: 10000 }],
            //   name: 'General Access',
            //   description: 'Gain general access to this website. You will not be allowed access if you own a scammer or spammer badge.',
            //   frozen: true,
            //   defaultSelected: true,
            //   // additionalCriteria: "HELLO!",
            //   additionalDisplay: <div>
            //     <BadgeAvatarDisplay
            //       collectionId={2n}
            //       badgeIds={[{ start: 1n, end: 10n }]}
            //     // showIds

            //     /></div>

            // },
            // {
            //   collectionId: 11,
            //   chain: 'BitBadges',
            //   assetIds: [{ start: 1, end: 10 }],
            //   mustOwnAmounts: { start: 1, end: 10000 },
            //   // ownershipTimes: [{ start: 1, end: 10000 }],
            //   name: 'Premium Features',
            //   description: 'Gain access to premium features on this website.  Restricted to people who own the membership badge.',
            //   frozen: false,
            //   defaultSelected: false,
            //   // additionalCriteria: "HELLO!",
            //   additionalDisplay: <div>
            //     <BadgeAvatarDisplay
            //       collectionId={11n}
            //       badgeIds={[{ start: 1n, end: 100n }]}
            //       lightTheme
            //     // showIds

            //     /></div>

            // },

          ]}
          signAndVerifyChallenge={signAndVerifyChallenge}
          canAddCustomAssets={false}
          customAddHelpDisplay={<>
            {loading && <Spin size='large' />}
          </>}
          hideConnectVsSignInHelper={hideLogin}
          allowTimeSelect
          maxTimeInFuture={168 * 60 * 60 * 1000}
        />
      }

    </div >
    {
      !hideLogo && <>
        <div>
          {!(hideLogo && !connected) &&
            <Avatar
              size={200}
              src={
                connected ? <BlockiesAvatar
                  avatar={avatar}
                  address={address.toLowerCase()}
                  fontSize={200}
                  shape={'circle'}
                /> :
                  <Image src="/images/bitbadgeslogo.png" alt="BitBadges Logo" height={'180px'} width={'180px'} quality={100} />
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