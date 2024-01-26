import { CheckCircleFilled, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Collapse, Progress, Spin, Tooltip } from 'antd';
import { UintRange } from 'bitbadgesjs-proto';
import { BigIntify, BitBadgesAddressList, NumberType, convertBlockinAuthSignatureDoc, convertToCosmosAddress, getChainForAddress, getMetadataForBadgeId, getTotalNumberOfBadgeIds } from 'bitbadgesjs-utils';
import { AndGroup, AssetConditionGroup, ChallengeParams, OrGroup, OwnershipRequirements, VerifyChallengeOptions, constructChallengeObjectFromString, convertChallengeParams, createChallenge } from 'blockin';
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

export const AssetConditionGroupUI = (
  { assetConditionGroup, depth = 0, bulletNumber, parentBullet, lists,
    address
  }: {
    assetConditionGroup: AssetConditionGroup<bigint>,
    depth?: number,
    bulletNumber: number,
    parentBullet: string,
    lists: BitBadgesAddressList<bigint>[];
    address: string;
  }
) => {

  const andItem = assetConditionGroup as AndGroup<bigint>;
  const orItem = assetConditionGroup as OrGroup<bigint>;
  const ownershipRequirements = assetConditionGroup as OwnershipRequirements<bigint>;

  const depthLetter = String.fromCharCode(65 + depth);
  const nextDepthLetter = String.fromCharCode(65 + depth + 1);
  const requirementNode = <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: 12 }} className='secondary-text'>
    <br />
    <InfoCircleOutlined /> To satisfy requirement {parentBullet ? parentBullet + '.' : ''}{bulletNumber}, {andItem.$and ? `ALL of the following must be satisfied.` : orItem.$or ? `ONE of the following must be satisfied.` : 'any'}
    <br /><br />
  </div >

  const panelHeader = <div style={{ whiteSpace: 'pre-wrap', textAlign: 'start', }} className='primary-text'>
    <b>Requirement {<>{parentBullet ? parentBullet + '.' : ''}{bulletNumber}</>}</b>
  </div>



  if (andItem['$and'] !== undefined) {
    const innerContent = <>
      {andItem['$and'].map((item, index) => {
        //If top level AND, we dont show the requirement node and shift everything over -16 bc it is not shown
        return <div key={index} style={{}}>
          <AssetConditionGroupUI

            assetConditionGroup={item}
            depth={depth + 1}
            bulletNumber={index + 1}
            parentBullet={depth == 0 ? '' : `${parentBullet ? parentBullet + '.' : ''}${bulletNumber}`}
            lists={lists}
            address={address}
          />
          {index !== andItem['$and'].length - 1 && <div className='secondary-text' style={{ textAlign: 'center', fontSize: 12 }}>
            AND
          </div>}
        </div>
      })}
    </>

    return <>
      {/* Top level ands can be removed bc that is the assumed behavior */}

      {depth > 0 &&
        <Collapse

          className='primary-text m-2'
          style={{ alignItems: 'center' }}
          expandIconPosition='start'
        >
          <Collapse.Panel
            className='full-width card-bg'
            key={bulletNumber + depthLetter + parentBullet + nextDepthLetter}
            header={panelHeader}>
            {requirementNode}
            {innerContent}
          </Collapse.Panel>

        </Collapse>
      }
      {depth == 0 && innerContent}

    </>
  } else if (orItem['$or'] !== undefined) {
    const innerContent = <>
      {orItem['$or'].map((item, index) => {
        return <div key={index}>
          <AssetConditionGroupUI
            assetConditionGroup={item}
            depth={depth + 1}
            bulletNumber={index + 1}
            parentBullet={depth == 0 ? '' : `${parentBullet ? parentBullet + '.' : ''}${bulletNumber}`}
            lists={lists}
            address={address}
          />
          {index !== orItem['$or'].length - 1 && <div className='secondary-text' style={{ textAlign: 'center', fontSize: 12 }}>
            OR
          </div>}

        </div>
      })}
    </>

    return <>
      {depth > 0 &&
        <Collapse

          className='primary-text m-2'
          style={{ alignItems: 'center' }}
          expandIconPosition='start'
        >
          <Collapse.Panel
            className='full-width card-bg'
            key={bulletNumber + depthLetter + parentBullet + nextDepthLetter}
            header={panelHeader}>
            {requirementNode}

            {orItem['$or'].map((item, index) => {
              return <div key={index}>
                <AssetConditionGroupUI
                  assetConditionGroup={item}
                  depth={depth + 1}
                  bulletNumber={index + 1}
                  parentBullet={depth == 0 ? '' : `${parentBullet ? parentBullet + '.' : ''}${bulletNumber}`}
                  lists={lists}
                  address={address}
                />
                {index !== orItem['$or'].length - 1 && <div className='secondary-text' style={{ textAlign: 'center', fontSize: 12 }}>
                  OR
                </div>}

              </div>
            })}

          </Collapse.Panel>

        </Collapse>
      }
      {depth == 0 && innerContent}
    </>
  } else {
    const containsList = ownershipRequirements.assets.some(asset => asset.collectionId === 'BitBadges Lists');
    const containsBadges = ownershipRequirements.assets.some(asset => asset.collectionId !== 'BitBadges Lists');
    const listsBadgesStr = containsList && containsBadges ? 'badges / lists' : containsList ? 'lists' : 'badges';
    let totalNumAssets = 0n;
    for (const asset of ownershipRequirements.assets) {
      if (asset.collectionId !== 'BitBadges Lists') {
        totalNumAssets += getTotalNumberOfBadgeIds(asset.assetIds as UintRange<bigint>[]);
      } else {
        totalNumAssets += BigInt(asset.assetIds.length);
      }
    }
    const normalRequirementNode = <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', }} className='secondary-text'> <br />
      <InfoCircleOutlined /> {ownershipRequirements.options?.numMatchesForVerification
        ? `Must satisfy for ${ownershipRequirements.options.numMatchesForVerification}/${totalNumAssets} ${listsBadgesStr}`
        : `Must satisfy for ${totalNumAssets}/${totalNumAssets} ${listsBadgesStr}`
      } below
      <br /><br />
    </div>

    const innerContent = <>
      {normalRequirementNode}

      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', marginBottom: 16 }} className='primary-text'>

        {ownershipRequirements.assets.map((asset, index) => {
          if (asset.collectionId === 'BitBadges Lists') {
            const includedInList = asset.mustOwnAmounts.start === 1n;

            return <div key={index}>
              You must {includedInList ? 'not be on' : 'be on'} the following lists: {lists.map(list => list.listId).join(', ')}
              <br />
              <ListInfiniteScroll
                addressOrUsername={address}
                hasMore={false}
                fetchMore={async () => { }}
                listsView={ownershipRequirements.assets.filter(x => x.collectionId === 'BitBadges Lists').map(x => {
                  return x.assetIds.map(y => lists.find(z => z.listId === y) ?? []).filter(x => x) as BitBadgesAddressList<bigint>[];
                }).flat()}
              />
            </div>
          }
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

          } {'from '}
            <Tooltip title={`Collection ID ${asset.collectionId.toString()}`}>
              <a onClick={() => { }}>{collection?.cachedCollectionMetadata?.name ?? 'Unknown Collection'}</a>
            </Tooltip></> : <>
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

          return <><div key={index} style={{ fontSize: 14, }}>
            {/* <b>Criteria {index + 1}</b> */}

            {<>
              {/* For the badges ({assetsText}),  */}
              {amountsText}{' '}
              of {assetsText} is owned
            </>}

            {' '}{(asset.ownershipTimes ?? []).length > 0 ? 'from ' +
              asset.ownershipTimes?.map(time => {
                if (typeof time === 'string') {
                  return new Date(time).toLocaleString();
                } else if (typeof time !== 'object') {
                  return new Date(Number(BigInt(time))).toLocaleString();
                } else {
                  return getTimeRangesString([time], '', true);
                }
              }).join(', ') + '' : 'at the time of sign in'}
            < br />
            <br />
            <BadgeAvatarDisplay
              collectionId={BigInt(asset.collectionId)} badgeIds={asset.assetIds.map(x => {
                if (typeof x === 'string') return { start: BigInt(x), end: BigInt(x) };
                return { start: BigInt(x.start), end: BigInt(x.end) };
              })} size={75}
            />

          </div>
            <br />
          </>
        })}
      </div >
    </>

    return <>
      <Collapse

        className='primary-text m-2'
        style={{ alignItems: 'center' }}
        expandIconPosition='start'
      >
        <Collapse.Panel
          className='full-width card-bg'

          key={bulletNumber + depthLetter + parentBullet + nextDepthLetter}
          header={panelHeader}
        >
          {innerContent}
        </Collapse.Panel>

      </Collapse>


    </>
  }
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
  const [simulateSuccess, setSimulateSuccess] = useState(false);
  const [lists, setLists] = useState<BitBadgesAddressList<bigint>[]>([]);

  const currAccount = useAccount(address);

  const blockinParams = useMemo(() => {
    if (!challengeParams) return undefined;
    const params = { ...convertChallengeParams(JSON.parse(challengeParams as string) as ChallengeParams<NumberType>, BigIntify), }
    return {
      ...params,
      address: allowAddressSelect ? address : params.address,
    }
  }, [challengeParams, allowAddressSelect, address]);

  useEffect(() => {
    function getCollectionIds(assetConditionGroup: AssetConditionGroup<bigint>, collectionIds: bigint[], listIds: string[] = []) {
      const andItem = assetConditionGroup as AndGroup<bigint>;
      const orItem = assetConditionGroup as OrGroup<bigint>;
      const normalItem = assetConditionGroup as OwnershipRequirements<bigint>;

      if (andItem.$and) {
        for (const item of andItem.$and) {
          getCollectionIds(item, collectionIds, listIds);
        }
      } else if (orItem.$or) {
        for (const item of orItem.$or) {
          getCollectionIds(item, collectionIds, listIds);
        }
      } else {
        for (const asset of normalItem.assets) {
          if (asset.collectionId) {
            if (asset.collectionId === 'BitBadges Lists') {
              listIds.push(asset.assetIds[0] as string);
            } else {
              collectionIds.push(BigInt(asset.collectionId));
            }
          }
        }
      }

    }


    const listIds: string[] = [];
    const collectionIdsToFetch: bigint[] = [];
    if (blockinParams?.assetOwnershipRequirements) {
      getCollectionIds(blockinParams?.assetOwnershipRequirements ?? {}, collectionIdsToFetch, listIds);
    }


    if (collectionIdsToFetch.length) {
      fetchCollections(collectionIdsToFetch);
    }

    if (listIds.length) {
      getAddressLists({ listsToFetch: listIds.map(x => { return { listId: x } }) }).then(lists => {
        setLists(lists.addressLists);
      })
    }
  }, [blockinParams]);

  useEffect(() => {
    if (!blockinParams?.address) return;
    fetchAccounts([blockinParams.address]);
  }, [blockinParams?.address]);

  const parsedVerifyOptions = useMemo(() => {
    return verifyOptions ? JSON.parse(verifyOptions as string) as VerifyChallengeOptions : undefined;
  }, [verifyOptions]);

  const [progressPercent, setProgressPercent] = useState(0);

  //update every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (parsedVerifyOptions?.issuedAtTimeWindowMs) {
        const progressPercent = Math.floor(100 * (Date.now() - new Date(blockinParams?.issuedAt ?? Date.now()).getTime()) / parsedVerifyOptions?.issuedAtTimeWindowMs)
        setProgressPercent(progressPercent);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [blockinParams?.issuedAt, parsedVerifyOptions?.issuedAtTimeWindowMs]);


  const simulateVerification = useCallback(async (params: ChallengeParams<bigint>) => {
    try {
      const blockinParams = params;
      if (!blockinParams.address) return;

      setSimulationMessage('');
      const challenge = createChallenge(blockinParams);
      const chain = getChainForAddress(constructChallengeObjectFromString(challenge, BigIntify).address);

      const verifyChallengeOptions: VerifyChallengeOptions = {
        expectedChallengeParams: {
          ...parsedVerifyOptions?.expectedChallengeParams,
          nonce: parsedVerifyOptions?.expectedChallengeParams?.nonce,
          address: allowAddressSelect ? blockinParams.address : parsedVerifyOptions?.expectedChallengeParams?.address,
        },
        issuedAtTimeWindowMs: parsedVerifyOptions?.issuedAtTimeWindowMs,
        earliestIssuedAt: parsedVerifyOptions?.earliestIssuedAt,
        // beforeVerification: parsedVerifyOptions?.beforeVerification, Don't allow this to be set
        balancesSnapshot: parsedVerifyOptions?.balancesSnapshot,
        skipTimestampVerification: parsedVerifyOptions?.skipTimestampVerification,
        skipAssetVerification: parsedVerifyOptions?.skipAssetVerification,

        skipSignatureVerification: true
      }

      setSimulateSuccess(true);
      await verifySignInGeneric({ message: challenge, chain: chain, signature: '', options: verifyChallengeOptions });
    } catch (e: any) {
      setSimulationMessage(`We ran into an error simulating this sign-in attempt: ${e.errorMessage ?? e.message}`);
      setSimulateSuccess(false);
      console.log(e);
    }
  }, [allowAddressSelect, parsedVerifyOptions]);

  useEffect(() => {
    if (expectVerifySuccess && blockinParams) {
      simulateVerification(blockinParams);
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
    if (!callbackRequired) {
      setQrCode(signature);
    }

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



  const flaggedWebsites: string[] = []; //'https://bitbadges.io', 'https://bitbadges.io/'
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
      return 'You will be authenticated forever (no expiration date).';
    } else if (notBefore && !expirationDate) {
      return `Your authentication will have no expiration date but will not be valid until ${new Date(notBefore).toLocaleString()}.`
    }
    else if (!notBefore && expirationDate) {
      return `Your authentication will expire at ${new Date(expirationDate).toLocaleString()}.`
    } else if (notBefore && expirationDate) {
      return `Your authentication will expire at ${new Date(expirationDate).toLocaleString()} and will not be valid until ${new Date(notBefore).toLocaleString()}.`
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
                            {authCode.params.assetOwnershipRequirements && <>
                              <b>Requirements</b>
                              <div className='secondary-text' style={{ textAlign: 'center', fontSize: 12 }}>
                                <InfoCircleOutlined /> To be approved, you must meet some criteria.
                              </div>
                              {expectVerifySuccess && simulateSuccess && <div className='flex-center secondary-text mt-2' style={{ fontSize: 12 }}>
                                <CheckCircleFilled style={{ color: 'green', marginRight: 4 }} /> Successfully simulated. You meet the requirements.
                              </div>}

                              <div style={{ whiteSpace: 'pre-wrap', textAlign: 'start' }} className='my-4'>
                                <AssetConditionGroupUI
                                  assetConditionGroup={authCode.params.assetOwnershipRequirements}
                                  bulletNumber={1}
                                  parentBullet={''}
                                  lists={lists}
                                  address={address as string}
                                />
                              </div>
                            </>}
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
                          {' '}Ensure all information is correct before signing.
                        </div>
                        <br />
                        <div className='secondary-text' style={{ textAlign: 'start' }}>

                          <InfoCircleOutlined style={{ color: 'orange' }} /> Upon clicking the button below,
                          this site will send a signature request to your connected address.

                          This is a simple message signature. It is not a transaction and is free of charge. The signature of this message is your secret authentication code.
                        </div>
                        <br />
                        {parsedVerifyOptions?.issuedAtTimeWindowMs && blockinParams.issuedAt && <>

                          <div className='secondary-text' style={{ textAlign: 'start' }}>
                            <InfoCircleOutlined style={{ color: 'orange' }} /> This sign-in request must be redeemed by {new Date(new Date(blockinParams.issuedAt).getTime() + parsedVerifyOptions?.issuedAtTimeWindowMs).toLocaleTimeString()} to be valid.
                          </div>
                          <Progress
                            percent={progressPercent}
                            status={progressPercent >= 100 ? 'exception' : 'active'}
                            showInfo={false}
                          />
                          < br />
                        </>}
                        <div className='flex-center'>
                          <button className='landing-button'
                            disabled={loading}
                            onClick={async () => {
                              setLoading(true)
                              setErrorMessage('');
                              try {
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
