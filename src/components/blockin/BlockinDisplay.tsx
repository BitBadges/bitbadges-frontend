import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Steps, Typography, notification } from 'antd';
import { BalanceArray, BigIntify, BlockinChallengeParams, SupportedChain, UintRangeArray } from 'bitbadgesjs-sdk';
import { ChallengeParams, SignAndVerifyChallengeResponse, SupportedChainMetadata, constructChallengeObjectFromString } from 'blockin';
import { BlockinUIDisplay, SignInModal } from 'blockin/dist/ui';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { DesiredNumberType, getSignInChallenge, signOut, verifySignIn } from '../../bitbadges-api/api';
import { SignChallengeResponse, useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useWeb2Context } from '../../bitbadges-api/contexts/chains/Web2Context';
import { INFINITE_LOOP_MODE } from '../../constants';
import { DiscordInputNode } from '../../integrations/auth';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BlockiesAvatar } from '../address/Blockies';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { RadioGroup } from '../inputs/Selects';

const { Text } = Typography;

export const BlockinDisplay = ({ hideLogo, hideLogin }: { hideLogo?: boolean; hideLogin?: boolean }) => {
  const { address, cosmosAddress, loggedIn, connect, disconnect, signChallenge, chain, setChain, connected, offChainOnlyMode, setOffChainOnlyMode } =
    useChainContext();

  const web2Context = useWeb2Context();

  const chainContext = useChainContext();

  const account = useAccount(address);
  const avatar = account?.profilePicUrl ?? account?.avatar;

  const [, setCookie] = useCookies(['blockincookie']);

  const [challengeParams, setChallengeParams] = useState<ChallengeParams<DesiredNumberType>>();
  const [web2ModalVisible, setWeb2ModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Update challengeParams when address or chain changes
   */
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: blockin display');
    async function updateChallengeParams() {
      if (address && connected && !loggedIn) {
        const res = await getSignInChallenge({ chain, address });
        setChallengeParams(res.params);
      }
    }

    updateChallengeParams();
  }, [address, chain, connected, loggedIn]);

  const handleSignChallenge = async (challenge: string) => {
    if (offChainOnlyMode) return { message: challenge, signature: '', publicKey: '' };
    return await signChallenge(challenge);
  };

  const handleVerifyChallenge = async (message: string, signature: string, publicKey?: string) => {
    try {
      await verifySignIn({ message, signature, publicKey });

      const challengeObj = constructChallengeObjectFromString(message, BigIntify);
      /**
       * At this point, the user has been verified by your backend and Blockin. Here, you will do anything needed
       * on the frontend to grant the user access such as setting loggedIn to true, adding cookies, or
       * anything else that needs to be updated.
       */
      chainContext.setChallengeParams(new BlockinChallengeParams(challengeObj)); //This sets the global context's challengeParams
      setCookie('blockincookie', cosmosAddress, {
        path: '/',
        expires: challengeObj?.expirationDate ? new Date(challengeObj.expirationDate) : undefined
      });
      return {
        success: true,
        message: 'Successfully signed in.'
      };
    } catch (e: any) {
      if (e.response.data) throw new Error(e.response.data.message);
      throw new Error(e.message);
    }
  };

  const signAndVerifyChallenge = async (challenge: string) => {
    const signChallengeResponse: SignChallengeResponse = await handleSignChallenge(challenge);
    // //Check if error in challenge signature
    // if (!signChallengeResponse.message || !signChallengeResponse.signature) {
    //   return { success: false, message: `${signChallengeResponse.message}` };
    // }

    const verifyChallengeResponse: SignAndVerifyChallengeResponse = await handleVerifyChallenge(
      signChallengeResponse.message,
      signChallengeResponse.signature,
      signChallengeResponse.publicKey
    );

    return verifyChallengeResponse;
  };

  /**
   * This is where the chain details in ChainContext are updated upon a new chain being selected.
   */
  const handleUpdateChain = async (newChainMetadata: SupportedChainMetadata) => {
    if (newChainMetadata?.name) {
      setChain(newChainMetadata.name as SupportedChain);
    }
  };

  const logout = async () => {
    await signOut({ signOutBlockin: true, signOutDiscord: true, signOutTwitter: true });
    setCookie('blockincookie', '', { path: '/' });
    chainContext.setChallengeParams(undefined);
    web2Context.setDiscord({ username: '', discriminator: '', id: '' });
  };

  return (
    <>
      <div className="flex-center flex-column">
        <RadioGroup
          options={[
            { label: 'Limited', value: true },
            { label: 'Full', value: false }
          ]}
          value={offChainOnlyMode}
          onChange={(e) => {
            setOffChainOnlyMode(e);
          }}
        />
      </div>
      <div className="secondary-text text-center px-3 mt-2">
        <InfoCircleOutlined />
        {offChainOnlyMode
          ? ' Limited mode allows you to sign in with an approved, non-crypto sign-in method. This gives access to most features, but you will not be able to sign messages or transactions. '
          : ' Connect and sign in with a web3 wallet. This gives access to all features.'}
      </div>
      {offChainOnlyMode && (
        <>
          {!loggedIn && (
            <div className="flex-center mt-4 full-width">
              <div className="full-width flex-center">
                <Steps
                  type="navigation"
                  current={currentStep}
                  onChange={(val) => {
                    setCurrentStep(val);
                  }}
                  style={{ maxWidth: 650 }}>
                  <Steps.Step title={<b className="primary-text hover:text-vivid-blue">Select Address</b>} />
                  <Steps.Step title={<b className="primary-text hover:text-vivid-blue">Sign-In Method</b>} disabled={!address} />
                  <Steps.Step
                    title={<b className="primary-text hover:text-vivid-blue">Complete</b>}
                    disabled={!address || !web2Context.discord.username}
                  />
                </Steps>
              </div>
            </div>
          )}
          {!loggedIn && (
            <div className="my-4 secondary-text px-3">
              {currentStep === 0 && 'Select the address to sign in for.'}
              {currentStep === 1 && 'Select a sign-in method. The selected method must be approved by the account.'}
              {currentStep === 2 && 'Complete the sign-in process.'}
            </div>
          )}
          {currentStep === 0 && !loggedIn && (
            <div className="flex-center mt-2">
              <AddressSelect
                addressOrUsername={web2Context.address}
                onUserSelect={(address) => {
                  web2Context.setAddress(address);
                }}
              />
            </div>
          )}
          {currentStep === 1 && address && !loggedIn && (
            <div className="flex-center primary-text">
              <DiscordInputNode
                setDisabled={() => {}}
                onSuccess={(username, id, discriminator) => {
                  console.log('discord', username, id, discriminator);
                  web2Context.setDiscord({
                    username,
                    id,
                    discriminator: discriminator ?? ''
                  });
                }}
              />
            </div>
          )}
          {currentStep === 2 && address && !loggedIn && web2Context.discord.username && (
            <div className="flex-center mt-4">
              <button
                className="landing-button"
                onClick={() => {
                  setWeb2ModalVisible(true);
                  setCurrentStep(0);
                }}>
                Sign In
              </button>
            </div>
          )}
          {address && loggedIn && (
            <div className="flex-center mt-4">
              <button
                className="landing-button"
                onClick={() => {
                  logout();
                  setCurrentStep(0);
                }}>
                Sign Out
              </button>
            </div>
          )}
          <div className="flex-center primary-text img-overrides" style={{ marginTop: 10 }}>
            <SignInModal
              nonWalletSignIn
              modalIsVisible={web2ModalVisible}
              setModalIsVisible={setWeb2ModalVisible}
              modalStyle={{ color: `white`, textAlign: 'start' }}
              address={address}
              selectedChainInfo={undefined}
              challengeParams={challengeParams}
              selectedChainName={chain}
              displayNotConnnectedWarning={false}
              displayedAssetGroups={[
                {
                  assetConditionGroup: {
                    assets: [
                      {
                        collectionId: 1,
                        chain: 'BitBadges',
                        assetIds: [{ start: 9, end: 9 }],
                        ownershipTimes: [],
                        mustOwnAmounts: { start: 0, end: 0 }
                      }
                    ]
                  },
                  name: 'General Access',
                  description: (
                    <>
                      To protect against known scammers and unwanted visitors, we do not allow access to this site if you have the scammer badge.,
                      <div className="dark">
                        <BadgeAvatarDisplay
                          collectionId={1n}
                          badgeIds={UintRangeArray.From([{ start: 9n, end: 9n }])}
                          size={100}
                          showSupplys
                          balance={BalanceArray.From([
                            {
                              amount: 0n,
                              badgeIds: [{ start: 9n, end: 9n }],
                              ownershipTimes: UintRangeArray.FullRanges()
                            }
                          ])}
                        />
                      </div>
                    </>
                  ),
                  image: '/images/bitbadgeslogo.png',
                  frozen: true,
                  defaultSelected: true
                }
              ]}
              signAndVerifyChallenge={signAndVerifyChallenge}
              maxTimeInFuture={168 * 60 * 60 * 1000} //1 week
            />
          </div>
        </>
      )}
      {!offChainOnlyMode && (
        <>
          <div className="flex-center primary-text img-overrides" style={{ marginTop: 10 }}>
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
                  });
                }
              }}
              buttonStyle={{ height: 45 }}
              modalStyle={{ color: `white`, textAlign: 'start' }}
              disconnect={async () => {
                disconnect();
              }}
              chainOptions={[
                //These should match what ChainDrivers are implemented in your backend.
                { name: 'Ethereum' },
                { name: 'Cosmos' },
                { name: 'Solana' },
                { name: 'Bitcoin' }
              ]}
              address={address}
              selectedChainInfo={undefined}
              onChainUpdate={handleUpdateChain}
              challengeParams={challengeParams}
              loggedIn={loggedIn}
              logout={async () => {
                await logout();
              }}
              selectedChainName={chain}
              displayedAssetGroups={[
                {
                  assetConditionGroup: {
                    assets: [
                      {
                        collectionId: 1,
                        chain: 'BitBadges',
                        assetIds: [{ start: 9, end: 9 }],
                        ownershipTimes: [],
                        mustOwnAmounts: { start: 0, end: 0 }
                      }
                    ]
                  },
                  name: 'General Access',
                  description: (
                    <>
                      To protect against known scammers and unwanted visitors, we do not allow access to this site if you have the scammer badge.,
                      <div className="dark">
                        <BadgeAvatarDisplay
                          collectionId={1n}
                          badgeIds={UintRangeArray.From([{ start: 9n, end: 9n }])}
                          size={100}
                          showSupplys
                          balance={BalanceArray.From([
                            {
                              amount: 0n,
                              badgeIds: [{ start: 9n, end: 9n }],
                              ownershipTimes: UintRangeArray.FullRanges()
                            }
                          ])}
                        />
                      </div>
                    </>
                  ),
                  image: '/images/bitbadgeslogo.png',
                  frozen: true,
                  defaultSelected: true
                }
              ]}
              signAndVerifyChallenge={signAndVerifyChallenge}
              hideConnectVsSignInHelper={hideLogin}
              maxTimeInFuture={168 * 60 * 60 * 1000} //1 week
            />
          </div>
        </>
      )}
      {!hideLogo && (!offChainOnlyMode || (offChainOnlyMode && loggedIn)) && (
        <>
          <div>
            {!(hideLogo && !connected) && (
              <Avatar
                size={200}
                shape="square"
                className="rounded-lg"
                src={
                  connected ? (
                    <BlockiesAvatar avatar={avatar} address={address.toLowerCase()} fontSize={200} />
                  ) : (
                    <Image src="/images/bitbadgeslogo.png" alt="BitBadges Logo" height={180} width={180} quality={100} />
                  )
                }
                style={{ marginTop: 40 }}
              />
            )}
          </div>
          <div className="flex-center"> {connected && <AddressDisplay addressOrUsername={address} fontSize={24} />}</div>
          <div>
            {' '}
            {connected && (
              <Text strong className="primary-text" style={{ fontSize: 20 }}>
                {loggedIn ? 'Signed In' : 'Not Signed In'}
              </Text>
            )}
          </div>
        </>
      )}
    </>
  );
};
