import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { BigIntify, NumberType, convertBlockinAuthSignatureInfo, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { ChallengeParams } from 'blockin';
import { SignInModal } from 'blockin/dist/ui';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { createAuthCode } from '../../bitbadges-api/api';
import { SignChallengeResponse, useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { EmptyIcon } from '../../components/common/Empty';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { AuthCode } from '../account/[addressOrUsername]/codes';

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
    callbackRequired
  } = router.query;


  const {
    address,
    selectedChainInfo,
    signChallenge,
  } = chain;

  const [modalIsVisible, setModalIsVisible] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const currAccount = useAccount(address);


  if (!challengeParams) {
    return <div style={{
      marginLeft: '3vw',
      marginRight: '3vw',
      paddingLeft: '1vw',
      paddingRight: '1vw',
      paddingTop: '20px',
      height: '100vh'
    }}>
      <EmptyIcon description='No message to sign found...' />
    </div>;
  }


  const blockinParams = JSON.parse(challengeParams as string) as ChallengeParams<NumberType>;
  if (allowAddressSelect) {
    blockinParams.address = address
  }

  if (generateNonce) {
    blockinParams.nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
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
        convertBlockinAuthSignatureInfo(
          {
            _id: signature,
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

    if (window.opener && callbackRequired) {
      window.opener.postMessage({ signature: signature, message: challenge }, '*');
    }

    return { success: true, message: 'Successfully signed challenge.' };
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
            {address && blockinParams.address && blockinParams.address !== address ?
              <div style={{
                marginLeft: '3vw',
                marginRight: '3vw',
                paddingLeft: '1vw',
                paddingRight: '1vw',
                paddingTop: '20px'
              }} className='flex-center flex-column'>
                <EmptyIcon description='The connected address does not match the expected address for this link. Please sign in with the correct address.' />
                <AddressDisplay addressOrUsername={blockinParams.address} fontSize={17} />
                <br />
                <br />
                <BlockinDisplay />
              </div> : <>

                <div className='flex-center'>
                  {!qrCode &&
                    <InformationDisplayCard md={12} xs={24} title='' style={{ marginTop: 16, textAlign: 'left' }}>

                      <AuthCode authCode={convertBlockinAuthSignatureInfo({
                        _id: '',
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
                        <InfoCircleOutlined /> To be authenticated, the site that directed you here requires you to sign the message below.
                        Once signed, a secret QR code will be generated for you to present at authentication time.
                        {window.opener && callbackRequired && <>
                          The site has also requested that the QR code be sent back to them for their use as well.
                        </>}
                      </div>
                      <br />
                      <div className='secondary-text' style={{ textAlign: 'center' }}>
                        <WarningOutlined style={{ color: 'orange' }} /> Ensure all the information above is correct before signing.
                      </div>
                      <br />



                      <div className='flex-center'>
                        <button className='landing-button' onClick={() => setModalIsVisible(true)} style={{ minWidth: 222, marginTop: 16 }}>
                          Sign Message
                        </button>
                      </div>

                    </InformationDisplayCard>
                  }
                  {qrCode &&
                    <InformationDisplayCard md={12} xs={24} title='' style={{ marginTop: 16, textAlign: 'left' }}>
                      <div className='flex-center'>
                        {!qrCode && <EmptyIcon description='No QR Code generated yet...' />}
                        {qrCode && <AuthCode authCode={convertBlockinAuthSignatureInfo({
                          _id: '',
                          signature: qrCode,
                          name: name as string,
                          description: description as string,
                          image: image as string,
                          params: blockinParams,
                          createdAt: Date.now(),
                          cosmosAddress: convertToCosmosAddress(address as string),
                        }, BigIntify)} />}

                      </div>
                      <div className='flex-center'>
                        <button className='landing-button' onClick={() => router.push(`/account/${chain.address}/codes`)} style={{ minWidth: 222 }}>
                          View All My Codes
                        </button>
                      </div>


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
