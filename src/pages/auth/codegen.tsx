import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { BigIntify, NumberType, convertBlockinAuthSignatureDoc, convertToCosmosAddress, getChainForAddress } from 'bitbadgesjs-utils';
import { ChallengeParams, VerifyChallengeOptions, constructChallengeObjectFromString } from 'blockin';
import { SignInModal } from 'blockin/dist/ui';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createAuthCode, verifySignInGeneric } from '../../bitbadges-api/api';
import { SignChallengeResponse, useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollections, getCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { BadgeAvatarDisplay } from '../../components/badges/BadgeAvatarDisplay';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { EmptyIcon } from '../../components/common/Empty';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { AuthCode } from '../account/codes';

export interface CodeGenQueryParams {
  challengeParams?: ChallengeParams<bigint>;
  name?: string;
  description?: string;
  image?: string;
  generateNonce?: boolean
  allowAddressSelect?: boolean;
  callbackRequired?: boolean;
  storeInAccount?: boolean;

  skipVerify?: boolean;
  verifyOptions?: VerifyChallengeOptions;
}

function BlockinCodesScreen() {
  const router = useRouter();
  const chain = useChainContext();
  const {
    challengeParams,
    name,
    description,
    image,
    generateNonce,
    allowAddressSelect,
    callbackRequired,
    storeInAccount,
    skipVerify,
    verifyOptions,
  } = router.query;


  const {
    address,
    selectedChainInfo,
    signChallenge,
  } = chain;

  const [modalIsVisible, setModalIsVisible] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const currAccount = useAccount(address);

  const blockinParams = useMemo(() => {
    if (!challengeParams) return undefined;
    return JSON.parse(challengeParams as string) as ChallengeParams<NumberType>;
  }, [challengeParams]);

  useEffect(() => {
    const collectionsToFetch = blockinParams?.assets?.filter(x => x.chain === "BitBadges" && x.collectionId) ?? [];
    const collectionIds = collectionsToFetch.map(x => BigInt(x.collectionId));
    fetchCollections(collectionIds);
  }, [blockinParams]);

  useEffect(() => {
    if (!blockinParams?.address) return;
    fetchAccounts([blockinParams.address]);
  }, [blockinParams?.address]);

  const randomNonce = useRef(crypto.getRandomValues(new Uint8Array(32)))


  if (!challengeParams || !blockinParams) {
    return <div style={{
      marginLeft: '3vw',
      marginRight: '3vw',
      paddingLeft: '1vw',
      paddingRight: '1vw',
      paddingTop: '20px',
      height: '100vh'
    }}>
      <EmptyIcon description='No message to sign found...' />
    </div>
  }

  if (allowAddressSelect) {
    blockinParams.address = address
  }


  if (generateNonce) {
    blockinParams.nonce = Buffer.from(randomNonce.current).toString('base64');
  }

  const handleSignChallenge = async (challenge: string) => {
    const response = await signChallenge(challenge);
    return response;
  }


  const signAndVerifyChallenge = async (challenge: string) => {
    const signChallengeResponse: SignChallengeResponse = await handleSignChallenge(challenge);
    //Check if error in challenge signature
    if (!signChallengeResponse.message || !signChallengeResponse.signature) {
      return { success: false, message: `${signChallengeResponse.message}` };
    }

    const signature = signChallengeResponse.signature;
    setQrCode(signature);

    if (storeInAccount) {
      await createAuthCode({
        signature: signature,
        message: challenge,
        name: name as string,
        description: description as string,
        image: image as string,
      });
      if (!currAccount) throw new Error('No account found');

      updateAccount({
        ...currAccount,
        authCodes: [
          ...(currAccount?.authCodes ?? []),
          convertBlockinAuthSignatureDoc(
            {
              _docId: signature,
              signature: signature,
              params: blockinParams,
              name: name as string,
              description: description as string,
              image: image as string,
              cosmosAddress: currAccount.cosmosAddress,
              createdAt: Date.now(),
            }, BigIntify)
        ]
      });
    }

    let verificationResponse: {
      success: boolean,
      errorMessage?: string
    } = { success: false, errorMessage: 'skipVerify is true' };
    if (!skipVerify) {
      try {
        const chain = getChainForAddress(constructChallengeObjectFromString(signChallengeResponse.message, BigIntify).address);
        const parsedVerifyOptions = verifyOptions ? JSON.parse(verifyOptions as string) : undefined;
        const verifyChallengeOptions: VerifyChallengeOptions = {
          expectedChallengeParams: {
            ...parsedVerifyOptions?.expectedChallengeParams,
            nonce: generateNonce ? blockinParams.nonce : parsedVerifyOptions?.expectedChallengeParams.nonce,
            address: allowAddressSelect ? blockinParams.address : parsedVerifyOptions?.expectedChallengeParams.address,
          },
          // beforeVerification: parsedVerifyOptions?.beforeVerification, Don't allow this to be set
          balancesSnapshot: parsedVerifyOptions?.balancesSnapshot,
          skipTimestampVerification: parsedVerifyOptions?.skipTimestampVerification,
          skipAssetVerification: parsedVerifyOptions?.skipAssetVerification,
        }

        await verifySignInGeneric({ message: signChallengeResponse.message, chain: chain, signature: signChallengeResponse.signature, options: verifyChallengeOptions });
        verificationResponse = { success: true };
      } catch (e: any) {
        verificationResponse = { success: false, errorMessage: e.errorMessage ?? e.message };
      }
    }


    if (window.opener && callbackRequired) {
      window.opener.postMessage({ signature: signature, message: challenge, verificationResponse }, '*');
      window.close();
    }

    return { ...verificationResponse, message: verificationResponse.errorMessage ?? '' };
  }

  const flaggedWebsites = ['https://bitbadges.io', 'https://bitbadges.io/'];

  return (
    <DisconnectedWrapper
      message='Please connect a wallet to access this page.'
      node={
        <div
          style={{
            marginLeft: '3vw',
            marginRight: '3vw',
            paddingLeft: '1vw',
            paddingRight: '1vw',
            paddingTop: '20px',
            minHeight: '100vh'
          }}
        >
          <div
            className='inherit-bg'
            style={{
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            {
              flaggedWebsites.includes(blockinParams.domain) &&
              <div className='' style={{ color: 'red' }}>
                <WarningOutlined style={{ color: 'red' }} /> <span style={{ color: 'red' }}> Be careful. This is likely a scam attempt. This site ({blockinParams.domain}) requesting authentication does not use QR codes.</span>
              </div>
            }
            {
              address && blockinParams.address && blockinParams.address !== address && !allowAddressSelect ?
                <div style={{
                  marginLeft: '3vw',
                  marginRight: '3vw',
                  paddingLeft: '1vw',
                  paddingRight: '1vw',
                  paddingTop: '20px'
                }} className='flex-center flex-column'>
                  <div className='primary-text flex-center flex-wrap'>The connected address
                    <div style={{ margin: 8 }}>
                      <AddressDisplay addressOrUsername={address} fontSize={17} />
                    </div>
                    does not match the expected address
                    <div style={{ margin: 8 }}>
                      <AddressDisplay addressOrUsername={blockinParams.address} fontSize={17} />
                    </div>
                    for this link. Please sign in with the correct address. </div>
                  <br />
                  <br />
                  <BlockinDisplay />
                </div> : <>

                  <div className='flex-center'>
                    {!qrCode &&
                      <InformationDisplayCard md={12} xs={24} title='' style={{ marginTop: 16, textAlign: 'left' }}>

                        <AuthCode authCode={convertBlockinAuthSignatureDoc({
                          _docId: '',
                          signature: '',
                          name: name as string,
                          description: description as string,
                          image: image as string,
                          params: blockinParams,
                          createdAt: Date.now(),
                          cosmosAddress: convertToCosmosAddress(address as string),
                        }, BigIntify)} />
                        <Divider />
                        <div className='secondary-text' style={{ textAlign: 'center' }}>
                          <InfoCircleOutlined /> To be authenticated, the provider that directed you here requires you to sign a message to generate a secret authentication code.
                          {window.opener && callbackRequired && <>
                            {' '}<WarningOutlined style={{ color: 'orange' }} /> <span style={{ color: 'orange' }}>This code will be sent back and used by the provider that directed you here. Do not proceed if you do not trust the provider that sent you here.</span>
                          </>}
                        </div>
                        <br />
                        <div className='secondary-text' style={{ textAlign: 'center' }}>
                          <WarningOutlined style={{ color: 'orange' }} /> Ensure all the information above is correct before signing.
                        </div>
                        <br />

                        <div className='flex-center'>
                          <button className='landing-button' onClick={() => setModalIsVisible(true)} style={{ minWidth: 222, marginTop: 16 }}>
                            Sign
                          </button>
                        </div>

                      </InformationDisplayCard>
                    }
                    {qrCode &&
                      <InformationDisplayCard md={12} xs={24} title='' style={{ marginTop: 16, textAlign: 'left' }}>
                        <div className='flex-center'>
                          {<AuthCode
                            onlyShowCode
                            notStoredInAccount={!storeInAccount}
                            setSavedAuthCodes={() => { }}
                            authCode={convertBlockinAuthSignatureDoc({
                              _docId: '',
                              signature: qrCode,
                              name: name as string,
                              description: description as string,
                              image: image as string,
                              params: blockinParams,
                              createdAt: Date.now(),
                              cosmosAddress: convertToCosmosAddress(address as string),
                            }, BigIntify)} />}
                        </div>

                        {storeInAccount && <>
                          <br />
                          <div className='flex-center'>
                            <button className='landing-button' onClick={() => window.open(window.location.origin + '/account/codes', '_blank')} style={{ minWidth: 222 }}>
                              View All My Codes
                            </button>
                          </div></>}
                      </InformationDisplayCard>
                    }
                  </div>
                  <div className='flex-center primary-text img-overrides'>
                    {
                      <SignInModal
                        modalIsVisible={modalIsVisible}
                        setModalIsVisible={setModalIsVisible}
                        modalStyle={{ color: `white`, textAlign: 'start' }}
                        address={address}
                        selectedChainInfo={selectedChainInfo}
                        challengeParams={blockinParams}
                        selectedChainName={chain.chain}
                        signAndVerifyChallenge={signAndVerifyChallenge}
                        displayNotConnnectedWarning={false}
                        displayedAssets={blockinParams.assets?.map(x => {
                          console.log(x);
                          const collection = x.chain === 'BitBadges' ? getCollection(BigInt(x.collectionId)) : undefined;

                          return {
                            ...x,
                            name: collection?.cachedCollectionMetadata?.name ?? '',
                            // image: collection?.cachedCollectionMetadata?.image ?? '',
                            description: 'To be granted access, you must satisfy the ownership requirements.',
                            defaultSelected: true,
                            frozen: true,
                            additionalDisplay: x.chain === 'BitBadges' ? <div>
                              <BadgeAvatarDisplay
                                collectionId={BigInt(x.collectionId)}
                                badgeIds={(x.assetIds).map(x => {
                                  if (typeof x === 'string') return { start: BigInt(x), end: BigInt(x) };
                                  return { start: BigInt(x.start), end: BigInt(x.end) };
                                })}
                                size={75}
                              />
                            </div> : undefined
                          }
                        }) ?? []}
                      />
                    }
                  </div>
                </>}

          </div>
        </div>
      }
    />
  );
}

export default BlockinCodesScreen;
