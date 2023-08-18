import { Avatar, InputNumber, Tooltip, Typography, notification } from "antd";
import { ChallengeParams, SignAndVerifyChallengeResponse, SupportedChainMetadata, constructChallengeObjectFromString } from 'blockin';
import { BlockinUIDisplay } from 'blockin/dist/ui';
import Image from 'next/image';
import { useEffect, useState } from "react";
import { getSignInChallenge, signOut, verifySignIn } from "../../bitbadges-api/api";
import { SignChallengeResponse, useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { AddressDisplay } from "../address/AddressDisplay";
import { BlockiesAvatar } from "../address/Blockies";
import { useCookies } from 'react-cookie';
import { SupportedChain } from "bitbadgesjs-utils";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { INFINITE_LOOP_MODE } from "../../constants";

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
    displayedResources,
    chain,
    setChain,
    connected,
  } = useChainContext();
  const accounts = useAccountsContext();
  const account = accounts.getAccount(address);
  const avatar = account?.profilePicUrl ?? account?.avatar;


  const [_cookies, setCookie] = useCookies(['blockincookie']);
  const [hours, setHours] = useState<number>(24);

  const [challengeParams, setChallengeParams] = useState<ChallengeParams>({
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
      if (address && connected) {
        const res = await getSignInChallenge({ chain, address, hours });
        setChallengeParams(res.params);
      }
    }

    if (connected && address) {
      updateChallengeParams();
    }
  }, [address, connected, hours, chain]);

  const handleSignChallenge = async (challenge: string) => {
    const response = await signChallenge(challenge);
    return response;
  }

  const handleVerifyChallenge = async (originalBytes: Uint8Array, signatureBytes: Uint8Array, _challengeObj?: ChallengeParams) => {
    const verificationResponse = await verifySignIn({ chain, originalBytes, signatureBytes });

    /**
     * At this point, the user has been verified by your backend and Blockin. Here, you will do anything needed
     * on the frontend to grant the user access such as setting loggedIn to true, adding cookies, or 
     * anything else that needs to be updated.
     */
    setLoggedIn(true);
    setCookie('blockincookie', cosmosAddress, { path: '/', expires: new Date(Date.now() + 1000 * 60 * 60 * hours) });
    return {
      success: true, message: `${verificationResponse.successMessage}`
    }
  }

  const signAndVerifyChallenge = async (challenge: string) => {
    //TODO: This regenerates a new request right before user signs it (thus updating nonce and expiration date). Should use the exact cached version the user sees. Probably have to work within Blockin to do that.
    const res = await getSignInChallenge({ chain, address, hours });
    setChallengeParams(res.params);


    const signChallengeResponse: SignChallengeResponse = await handleSignChallenge(res.blockinMessage);
    //Check if error in challenge signature
    if (!signChallengeResponse.originalBytes || !signChallengeResponse.signatureBytes) {
      return { success: false, message: `${signChallengeResponse.message}` };
    }

    const verifyChallengeResponse: SignAndVerifyChallengeResponse = await handleVerifyChallenge(
      signChallengeResponse.originalBytes,
      signChallengeResponse.signatureBytes,
      constructChallengeObjectFromString(challenge)
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
    const res = await getSignInChallenge({ chain, address, hours });
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
          buttonStyle={{ minWidth: 100 }}
          modalStyle={{ color: `black` }}
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
          displayedResources={displayedResources}
          signAndVerifyChallenge={signAndVerifyChallenge}
          canAddCustomAssets={false}
        />
      }

    </div>
    {!hideLogin && <>
      <div className='flex-center' style={{ color: 'black', alignItems: 'center', marginTop: 4 }}>
        <Typography.Text className='secondary-text'>
          Remember my sign-in for
        </Typography.Text>
        <InputNumber
          value={hours}
          onChange={(value) => {
            setHours(value);
          }}
          min={1}
          max={168}
          className='primary-text primary-blue-bg'
          style={{ width: 70, marginLeft: 10, marginRight: 10 }}
        />
        <Typography.Text className='secondary-text'>
          hours
        </Typography.Text>
      </div>
      <br />
      <div className='flex-center' style={{ color: 'black' }}>
        <Typography.Text className='secondary-text'>
          <Tooltip placement="bottom" color="black" title={<>
            {"What is the difference between connecting and signing in?"}
            <br />
            <br />
            {"Connecting is simply providing us with what your public address is so that we can fetch and display your PUBLIC information, such as your badge balances. This also allows lets us know what address to prompt you to sign transactions with."}
            <br />
            <br />
            {"Signing in lets you prove your identity (that you are the owner of the address) to our website, similar to a password. This allows you to access PRIVATE features for our website that are only available to authenticated users, such as customizing your profile."}
            <br />
            <br />
            {"Note certain features may require both connecting and signing in."}
          </>}
          >
            <InfoCircleOutlined /> Hover to learn more
          </Tooltip>
        </Typography.Text>
      </div>
    </>}
    {!hideLogo && <>
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
    </>}
  </>;
}