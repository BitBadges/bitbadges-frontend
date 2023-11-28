import { BigIntify, Stringify } from 'bitbadgesjs-proto';
import { ChallengeParams, constructChallengeObjectFromString } from 'blockin';
import { SignInModal } from 'blockin/dist/ui';
import { SHA256 } from 'crypto-js';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { DesiredNumberType, verifySignIn } from '../../bitbadges-api/api';
import { SignChallengeResponse, useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { EmptyIcon } from '../../components/common/Empty';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';

function BlockinCodesScreen() {
  const router = useRouter();
  const chain = useChainContext();
  const { blockinMessage } = router.query;

  const {
    address,
    selectedChainInfo,
    signChallenge
  } = chain;

  //convert all %20 to spaces and so on 
  // const blockinMessageDecoded = decodeURIComponent(blockinMessage as string ?? '');
  const blockinMessageDecoded = `https://bitbadges.io wants you to sign in with your Ethereum account\n0xb48B65D09aaCe9d3EBDE4De409Ef18556eb53085\n\nBitBadges uses Blockin to authenticate users. By signing in, you agree to our privacy policy and terms of service.\n\nURI: https://bitbadges.io\nVersion: 1\nChain ID: 1\nNonce: KOJVTizuGaO92tVfw\nIssued At: 2023-11-28T14:08:34.003Z\nExpiration Time: 2023-11-29T14:08:31.873Z\nResources:\nAssets:\n- Chain: BitBadges\nCollection ID: 1\nAsset IDs:\n- ID Range: 8 to 8\nOwnership Times:\n- Sign-In Time\nOwnership Amounts:\n- Amount: Exactly x0`;
  // const _challengeParams = constructChallengeObjectFromString(blockinMessageDecoded as string ?? '', Stringify);


  // BitBadges uses Blockin to authenticate users. By signing in, you agree to our privacy policy and terms of service.

  // URI: https://bitbadges.io
  // Version: 1
  // Chain ID: 1
  // Nonce: KOJVTizuGaO92tVfw
  // Issued At: 2023-11-28T14:08:34.003Z
  // Expiration Time: 2023-11-29T14:08:31.873Z
  // Resources:
  // Assets:
  // - Chain: BitBadges
  //   Collection ID: 1
  //   Asset IDs:
  //     - ID Range: 8 to 8
  //   Ownership Times:
  //     - Sign-In Time
  //   Ownership Amounts:
  //     - Amount: Exactly x0`

  const [modalIsVisible, setModalIsVisible] = useState(false);

  const [qrCode, setQrCode] = useState('');



  if (!blockinMessage) {
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
  console.log(blockinMessageDecoded);
  const challengeParams = constructChallengeObjectFromString(blockinMessageDecoded as string ?? '', Stringify);
  challengeParams.address = chain.address;
  console.log(challengeParams);
  const messageArray = blockinMessageDecoded.split("\n");
  const uri = messageArray[5].split('URI: ')[1];
  console.log(uri);

  // const challengeParamsAreValid = challengeParams && challengeParams.address && challengeParams.domain && challengeParams.statement && challengeParams.uri && challengeParams.nonce;
  console.log(challengeParams && challengeParams.address && challengeParams.domain && challengeParams.statement && challengeParams.uri);

  const handleSignChallenge = async (challenge: string) => {
    const response = await signChallenge(challenge);
    return response;
  }

  const handleVerifyChallenge = async (originalBytes: Uint8Array, signatureBytes: Uint8Array, _challengeObj?: ChallengeParams<DesiredNumberType>) => {

    try {
      const verificationResponse = await verifySignIn({
        chain: chain.chain, originalBytes, signatureBytes, options: {
          skipAssetVerification: true,
          skipTimestampVerification: true,
          qrCode: true,
        }
      });


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
    if (!signChallengeResponse.originalBytes || !signChallengeResponse.signatureBytes) {
      return { success: false, message: `${signChallengeResponse.message}` };
    }

    const verifyChallengeResponse = await handleVerifyChallenge(
      signChallengeResponse.originalBytes,
      signChallengeResponse.signatureBytes,
      constructChallengeObjectFromString(challenge, BigIntify)
    );

    const hexSignature = (signChallengeResponse as any).hexSignature

    console.log(verifyChallengeResponse.qrCodeText);
    console.log(SHA256(challenge).toString())
    console.log(hexSignature);


    console.log(blockinMessageDecoded + ' ' + hexSignature);
    setQrCode(hexSignature);

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
          }}
        >
          <div
            className='inherit-bg'
            style={{
              minHeight: '100vh',
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            <button className='landing-button' onClick={() => setModalIsVisible(true)}>
              Generate QR Code
            </button>
            <div className='flex-center primary-text img-overrides'>
              {
                <SignInModal

                  modalIsVisible={modalIsVisible}
                  setModalIsVisible={setModalIsVisible}
                  modalStyle={{ color: `white`, textAlign: 'start' }}
                  address={address}
                  selectedChainInfo={selectedChainInfo}
                  challengeParams={challengeParams}
                  selectedChainName={chain.chain}
                  signAndVerifyChallenge={signAndVerifyChallenge}
                  displayNotConnnectedWarning={false}
                />
              }
            </div>
            {qrCode && <QRCode value={qrCode} ecLevel='L' />}
          </div>
        </div>
      }
    />
  );
}

export default BlockinCodesScreen;
