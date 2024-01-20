import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Spin, Tooltip } from 'antd';
import { BigIntify, BitBadgesAddressList, NumberType, convertBlockinAuthSignatureDoc, convertToCosmosAddress, getChainForAddress, getMetadataForBadgeId, getTotalNumberOfBadgeIds } from 'bitbadgesjs-utils';
import { ChallengeParams, VerifyChallengeOptions, constructChallengeObjectFromString, convertChallengeParams, createChallenge } from 'blockin';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createAuthCode, getAddressLists, verifySignInGeneric } from '../../bitbadges-api/api';
import { SignChallengeResponse, useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollections, getCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { BadgeAvatarDisplay } from '../../components/badges/BadgeAvatarDisplay';
import { ListInfiniteScroll } from '../../components/badges/ListInfiniteScroll';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { EmptyIcon } from '../../components/common/Empty';
import { ErrDisplay } from '../../components/common/ErrDisplay';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { getTimeRangesString } from '../../utils/dates';
import { AuthCode } from '../account/codes';

export interface CodeGenQueryParams {
  challengeParams?: ChallengeParams<bigint>;
  name?: string;
  description?: string;
  image?: string;
  allowAddressSelect?: boolean;
  callbackRequired?: boolean;
  storeInAccount?: boolean;

  skipVerify?: boolean;
  verifyOptions?: VerifyChallengeOptions;

  expectVerifySuccess?: boolean;
}

function BlockinCodesScreen() {
  const router = useRouter();
  const chain = useChainContext();
  const {
    challengeParams,
    name,
    description,
    image,
    allowAddressSelect,
    callbackRequired,
    storeInAccount,
    skipVerify,
    verifyOptions,
    expectVerifySuccess,
  } = router.query;


  const {
    address,
    signChallenge,
  } = chain;

  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [simulationMessage, setSimulationMessage] = useState('');
  const [lists, setLists] = useState<BitBadgesAddressList<bigint>[]>([]);

  const currAccount = useAccount(address);

  const blockinParams = useMemo(() => {
    if (!challengeParams) return undefined;
    return convertChallengeParams(JSON.parse(challengeParams as string) as ChallengeParams<NumberType>, BigIntify);
  }, [challengeParams]);

  useEffect(() => {
    const collectionsToFetch = blockinParams?.assets?.filter(x => x.chain === "BitBadges" && x.collectionId && x.collectionId !== "BitBadges Lists") ?? [];
    const collectionIds = collectionsToFetch.map(x => BigInt(x.collectionId));
    fetchCollections(collectionIds);

    const listsToFetch = blockinParams?.assets?.filter(x => x.chain === "BitBadges" && x.collectionId === "BitBadges Lists") ?? [];
    if (listsToFetch.length) {
      getAddressLists({ listsToFetch: listsToFetch.map(x => { return { listId: x.assetIds[0] as string } }) }).then(lists => {
        setLists(lists.addressLists);
      })
    }
  }, [blockinParams]);

  useEffect(() => {
    if (!blockinParams?.address) return;
    fetchAccounts([blockinParams.address]);
  }, [blockinParams?.address]);

  const simulateVerification = useCallback(async (challenge: string) => {
    try {
      setSimulationMessage('');
      const blockinParams = constructChallengeObjectFromString(challenge, BigIntify)
      const chain = getChainForAddress(constructChallengeObjectFromString(challenge, BigIntify).address);
      const parsedVerifyOptions = verifyOptions ? JSON.parse(verifyOptions as string) : undefined;

      const verifyChallengeOptions: VerifyChallengeOptions = {
        expectedChallengeParams: {
          ...parsedVerifyOptions?.expectedChallengeParams,
          nonce: parsedVerifyOptions?.expectedChallengeParams.nonce,
          address: allowAddressSelect ? blockinParams.address : parsedVerifyOptions?.expectedChallengeParams.address,
        },
        // beforeVerification: parsedVerifyOptions?.beforeVerification, Don't allow this to be set
        balancesSnapshot: parsedVerifyOptions?.balancesSnapshot,
        skipTimestampVerification: parsedVerifyOptions?.skipTimestampVerification,
        skipAssetVerification: parsedVerifyOptions?.skipAssetVerification,

        skipSignatureVerification: true
      }

      await verifySignInGeneric({ message: challenge, chain: chain, signature: '', options: verifyChallengeOptions });
    } catch (e: any) {
      setSimulationMessage(`We ran into an error simulating this sign-in attempt: ${e.errorMessage ?? e.message}`);
      console.log(e);
    }
  }, [allowAddressSelect, verifyOptions]);

  useEffect(() => {
    if (expectVerifySuccess && blockinParams) {
      simulateVerification(createChallenge(blockinParams));
    }
  }, [blockinParams, expectVerifySuccess, simulateVerification]);


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
    } = { success: false, errorMessage: skipVerify ? 'skipVerify is true' : 'Not used for non-callback requests' };
    if (!skipVerify && callbackRequired) {
      try {
        const chain = getChainForAddress(constructChallengeObjectFromString(signChallengeResponse.message, BigIntify).address);
        const parsedVerifyOptions = verifyOptions ? JSON.parse(verifyOptions as string) : undefined;

        const verifyChallengeOptions: VerifyChallengeOptions = {
          expectedChallengeParams: {
            ...parsedVerifyOptions?.expectedChallengeParams,
            nonce: parsedVerifyOptions?.expectedChallengeParams.nonce,
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
  const authCode = convertBlockinAuthSignatureDoc({
    _docId: '',
    signature: '',
    name: name as string,
    description: description as string,
    image: image as string,
    params: blockinParams,
    createdAt: Date.now(),
    cosmosAddress: convertToCosmosAddress(address as string),
  }, BigIntify)

  const generateHumanReadableTimeDetails = (notBefore?: string, expirationDate?: string) => {
    if (!notBefore && !expirationDate) {
      return 'This sign-in will always be valid (no expiration date).';
    } else if (notBefore && !expirationDate) {
      return `This sign-in will have no expiration date but will not be valid until ${new Date(notBefore).toLocaleString()}.`
    }
    else if (!notBefore && expirationDate) {
      return `This sign-in will expire at ${new Date(expirationDate).toLocaleString()}.`
    } else if (notBefore && expirationDate) {
      return `This sign-in will expire at ${new Date(expirationDate).toLocaleString()} and will not be valid until ${new Date(notBefore).toLocaleString()}.`
    } else {
      throw 'Error: Invalid time details.'
    }
  }

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
                        <InformationDisplayCard span={24} title={""} inheritBg noBorder>
                          {/* const paramKeyOrder = [ 'statement', 'nonce', 'signature', 'description']; */}

                          <AuthCode
                            onlyShowMetadata
                            authCode={authCode}
                          />
                          <br />
                          <div className='' style={{ textAlign: 'center', fontSize: 16 }}>
                            Sign-In Request: <a href={authCode.params.domain} target='_blank' rel="noreferrer">{authCode.params.domain}</a> {
                              authCode.params.domain !== authCode.params.uri && <>(<a href={authCode.params.uri} target='_blank' rel="noreferrer">{authCode.params.uri}</a>)</>
                            }<br />
                            <div className='flex-center'>
                              <AddressDisplay addressOrUsername={authCode.params.address} />
                            </div>
                            <br />

                            {authCode.params.statement}
                            <br /><br />
                            {generateHumanReadableTimeDetails(authCode.params.notBefore, authCode.params.expirationDate)}
                            <br /><br />
                            {/* {authCode.params.resources && !!authCode.params.resources.length ? <TableRow label={'Resources'} value={authCode.params.resources.join(', ')} labelSpan={8} valueSpan={16} /> : <></>} */}

                            {authCode.params.assets?.map((asset, i) => {
                              if (asset.collectionId === 'BitBadges Lists') {
                                const includedInList = asset.mustOwnAmounts.start === 1n;

                                return <div key={i}>
                                  You must be {includedInList ? 'included in' : 'excluded from'} all of the following lists:
                                  <br />
                                  <ListInfiniteScroll
                                    addressOrUsername={address}
                                    hasMore={false}
                                    fetchMore={async () => { }}
                                    listsView={lists}
                                  />
                                </div>
                              }
                              const chainName = asset.chain;
                              const badgeIds = asset.assetIds.map(x => {
                                if (typeof x === 'string') return { start: 1n, end: 1n }; //List
                                return { start: BigInt(x.start), end: BigInt(x.end) };
                              });
                              const hasMoreThanOneBadge = getTotalNumberOfBadgeIds(badgeIds) > 1;
                              const collection = getCollection(BigInt(asset.collectionId));
                              const badgeMetadata = !hasMoreThanOneBadge ? getMetadataForBadgeId(
                                badgeIds[0].start,
                                collection?.cachedBadgeMetadata ?? [],
                              ) : undefined
                              const assetsText = hasMoreThanOneBadge ? <>{
                                asset.assetIds.map((assetId, index) => {
                                  if (typeof assetId !== 'object') {
                                    return <>{"ID: " + assetId.toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
                                  } else {
                                    if (assetId.start === assetId.end) {
                                      return <>ID {BigInt(assetId.start).toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
                                    }
                                    return <>IDs {BigInt(assetId.start).toString()}-{BigInt(assetId.end).toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
                                  }
                                })
                              }</> : <>
                                <Tooltip title={`Badge ID ${badgeIds[0].start.toString()}`}>
                                  <a onClick={() => { }}>{badgeMetadata?.name ?? 'Unknown Badge'}</a>
                                </Tooltip>
                                {' from '}
                                <Tooltip title={`Collection ID ${asset.collectionId.toString()}`}>
                                  <a onClick={() => { }}>{collection?.cachedCollectionMetadata?.name ?? 'Unknown Collection'}</a>
                                </Tooltip>

                              </>



                              const amountsText = <>{[asset.mustOwnAmounts].map(amount => {
                                if (typeof amount !== 'object') {
                                  return 'x' + BigInt(amount).toString();
                                } else {
                                  if (amount.start === amount.end) {
                                    return `x${BigInt(amount.start).toString()}`
                                  }
                                  return `x${BigInt(amount.start).toString()}-${BigInt(amount.end).toString()}`
                                }
                              }).join(', ')}</>


                              return <div key={i}>
                                {hasMoreThanOneBadge && <>
                                  For {asset.mustSatisfyForAllAssets ? 'all' : 'one'} of the specified badges ({assetsText} from {chainName + " Collection: " + asset.collectionId.toString()}), you must own {amountsText}
                                </>}
                                {!hasMoreThanOneBadge && <>
                                  You must own {amountsText} of the specified badges ({assetsText})
                                </>}

                                {' '}{(asset.ownershipTimes ?? []).length > 0 ? 'during the times (' +
                                  asset.ownershipTimes?.map(time => {
                                    if (typeof time === 'string') {
                                      return new Date(time).toLocaleString();
                                    } else if (typeof time !== 'object') {
                                      return new Date(Number(BigInt(time))).toLocaleString();
                                    } else {
                                      return getTimeRangesString([time], '', true);
                                    }
                                  }).join(', ') + ')' : 'at the time of sign in'} to be approved.
                                <br />
                                <br />
                                <BadgeAvatarDisplay
                                  collectionId={BigInt(asset.collectionId)} badgeIds={asset.assetIds.map(x => {
                                    if (typeof x === 'string') return { start: BigInt(x), end: BigInt(x) };
                                    return { start: BigInt(x.start), end: BigInt(x.end) };
                                  })} size={75}
                                />
                              </div>

                            })}
                          </div>
                        </InformationDisplayCard>
                        <br />

                        <div className='secondary-text' style={{ textAlign: 'start' }}>
                          <WarningOutlined style={{ color: 'orange' }} /> This sign in request is for <a href={blockinParams.domain} target='_blank' rel='noreferrer'>{blockinParams.domain}</a>.
                          {window.opener && callbackRequired && <>
                            {' '}If you did not navigate to this site from <a href={blockinParams.domain} target='_blank' rel='noreferrer'>{blockinParams.domain}</a>
                            {' '}or a trusted source, do not proceed.
                            Your secret sign-in code will be sent back to the provider that directed you here.
                          </>}


                          {!(window.opener && callbackRequired) && <>
                            {' '}To be authenticated, you will sign a message to generate a secret authentication code.
                            {storeInAccount && ' This code will be stored in your account.'}
                            {!storeInAccount && ' This code will be only able to be viewed once.'}
                            {' '}For authentication, you are expected to present this code to the requesting party using their preferred method.
                          </>}
                          {' '}Read the message carefully and ensure all the information is correct before signing.
                        </div>
                        <br />
                        <div className='secondary-text' style={{ textAlign: 'start' }}>

                          <InfoCircleOutlined style={{ color: 'orange' }} /> Upon clicking the button below,
                          this site will send a signature request to your connected address.

                          This is a simple message signature. It is not a transaction and is free of charge. The signature of this message is your secret authentication code.
                        </div>
                        <br />
                        <div className='flex-center'>
                          <button className='landing-button'
                            disabled={loading}
                            onClick={async () => {
                              setLoading(true)
                              setErrorMessage('');
                              try {
                                console.log(blockinParams);
                                await signAndVerifyChallenge(createChallenge(blockinParams));
                                setLoading(false)
                              } catch (e: any) {
                                console.log(e);
                                setLoading(false)
                                setErrorMessage(e.errorMessage ?? e.message);
                              }
                            }} style={{ minWidth: 222, marginTop: 16 }}>
                            Sign {loading && <Spin />}
                          </button>

                        </div>
                        <br />
                        {simulationMessage && <ErrDisplay err={simulationMessage} warning />}
                        {errorMessage && simulationMessage && <br />}
                        {errorMessage && <ErrDisplay err={errorMessage} />}
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
                  {/* <div className='flex-center primary-text img-overrides'>
                    {
                      <SignInModal
                        customBeforeSigningWarning='BitBadges will relay your authentication code to the provider that directed you here.'
                        modalIsVisible={modalIsVisible}
                        setModalIsVisible={setModalIsVisible}
                        modalStyle={{ color: `white`, textAlign: 'start' }}
                        address={address}
                        selectedChainInfo={selectedChainInfo}
                        challengeParams={blockinParams}
                        selectedChainName={chain.chain}
                        signAndVerifyChallenge={signAndVerifyChallenge}
                        displayNotConnnectedWarning={false}
                        displayedAssets={displayedAssets}
                      />
                    }
                  </div> */}
                </>}

          </div>
        </ div>
      }
    />
  );
}

export default BlockinCodesScreen;
