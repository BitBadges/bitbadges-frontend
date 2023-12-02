import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { NumberType } from 'bitbadgesjs-utils';
import { ChallengeParams, constructChallengeStringFromChallengeObject } from 'blockin';
import { SignInModal } from 'blockin/dist/ui';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { createAuthCode, verifySignInGeneric } from '../../bitbadges-api/api';
import { SignChallengeResponse, useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { EmptyIcon } from '../../components/common/Empty';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';

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

  const [meetsAssetVerification, setMeetsAssetVerification] = useState(false);


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

  const challenge = constructChallengeStringFromChallengeObject(blockinParams, chain.chain);




  const handleSignChallenge = async (challenge: string) => {
    const response = await signChallenge(challenge);
    return response;
  }

  const handleVerifyChallenge = async (message: string, signature: string) => {

    try {
      const verificationResponse = await verifySignInGeneric({
        chain: chain.chain, message, signature, options: {
          skipAssetVerification: true,
          skipTimestampVerification: true,
        }
      });

      try {
        const verificationResponseWithAssets = await verifySignInGeneric({
          chain: chain.chain, message, signature, options: {
            skipTimestampVerification: true,
          }
        });
        setMeetsAssetVerification(verificationResponseWithAssets.success);
      } catch (e) {
        setMeetsAssetVerification(false);
      }


      /**
       * At this point, the user has been verified by your backend and Blockin. Here, you will do anything needed
       * on the frontend to grant the user access such as setting loggedIn to true, adding cookies, or 
       * anything else that needs to be updated.
       */
      return {
        message: `${verificationResponse.successMessage}`, ...verificationResponse
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

    const verifyChallengeResponse = await handleVerifyChallenge(
      signChallengeResponse.message,
      signChallengeResponse.signature
    );

    const signature = signChallengeResponse.signature;
    setQrCode(signature);

    await createAuthCode({
      signature: signature,
      message: challenge,
      name: name as string,
      description: description as string,
      image: image as string,
    });

    if (window.opener && callbackRequired) {
      window.opener.postMessage({ signature: signature, message: challenge }, '*');
    }

    // const pass = await PKPass.from({
    //   /**
    //    * Note: .pass extension is enforced when reading a
    //    * model from FS, even if not specified here below
    //    */
    //   model: "./passModels/myFirstModel.pass",

    // }, {
    //   // keys to be added or overridden
    //   serialNumber: "AAGH44625236dddaffbda"
    // });


    return verifyChallengeResponse;
  }


  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet and sign in to access this page.'
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
            {address && blockinParams.address && blockinParams.address !== address &&
              <div style={{
                marginLeft: '3vw',
                marginRight: '3vw',
                paddingLeft: '1vw',
                paddingRight: '1vw',
                paddingTop: '20px'
              }} className='flex-center flex-column'>
                <EmptyIcon description='The address in the challenge message does not match your current wallet address. Please sign in with the correct address.' />
                <AddressDisplay addressOrUsername={blockinParams.address} fontSize={17} />
                <br />
                <br />
                <BlockinDisplay />
              </div>}

            <CollectionHeader
              collectionId={1n} //dummy value
              metadataOverride={{
                name: name as string,
                description: description as string,
                image: image as string,
              }}
              hideCollectionLink
            />
            <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
              {description}
            </div>


            <div className='flex-center'>
              {!qrCode &&
                <InformationDisplayCard md={12} xs={24} title='Sign-In Message' style={{ marginTop: 16, textAlign: 'left' }}>
                  <div className='secondary-text' style={{ textAlign: 'center' }}>
                    <InfoCircleOutlined /> To be authenticated, the website that directed you here requires you to sign the message below.
                    Once signed, a secret QR code will be generated for you to present at authentication time.
                  </div>

                  <Divider />


                  <pre style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {challenge}
                  </pre>
                  <div className='flex-center'>
                    <button className='landing-button' onClick={() => setModalIsVisible(true)} style={{ minWidth: 222 }}>
                      Sign Message
                    </button>
                  </div>
                  <br />
                  <div className='secondary-text' style={{ textAlign: 'center' }}>
                    <WarningOutlined style={{ color: 'orange' }} /> Ensure all the information above is correct before signing.
                  </div>
                  <br />

                  {window.opener && callbackRequired && <div className='secondary-text'>
                    <InfoCircleOutlined /> Note that the generated QR code will also be sent and potentially used by the website that directed you here.
                  </div>}
                </InformationDisplayCard>
              }
              {qrCode &&
                <InformationDisplayCard md={12} xs={24} title='QR Code' style={{ marginTop: 16, textAlign: 'left' }}>
                  <div className='flex-center'>
                    {!qrCode && <EmptyIcon description='No QR Code generated yet...' />}
                    {qrCode && <QRCode value={qrCode} ecLevel='L' size={256} />}
                  </div>
                  <br />
                  {qrCode && <div className=''>

                    <div className='secondary-text' style={{ marginLeft: 8 }}>
                      <InfoCircleOutlined /> This QR code has been stored in your BitBadges account via your codes page. However, we strongly recommend also storing it elsewhere for access at authentication time.
                      Your options include, but are not limited to, storing it in a manager like Apple Wallet, emailing it to yourself, screenshotting it, physically printing it, and saving it to your device.
                      <br />
                      <br />
                      Reminder: If you are signed out of BitBadges, you need to sign in with your crypto wallet which you may not have handy at authentication time.
                      This is why we recommend storing the QR code elsewhere.

                    </div>
                  </div>}

                  {qrCode && !meetsAssetVerification && <div className=''>

                    <div className='secondary-text' style={{ marginLeft: 8 }}>
                      <WarningOutlined style={{ color: 'red', }} /> We detected that you currently do not meet the badge / asset requirements for this sign in.
                      Please ensure you do at authentication time.
                    </div>
                  </div>}
                  <br />
                  <div className='secondary-text' style={{ marginLeft: 8 }}>
                    <WarningOutlined style={{ color: 'orange' }} /> This QR code is what will be used to grant access, so it is important that you do not share it with anyone.
                  </div>
                  <br />

                  <br />
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

          </div>
        </div>
      }
    />
  );
}

export default BlockinCodesScreen;
