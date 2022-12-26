/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import { SignChallengeResponse, useChainContext } from "../../chain/ChainContext"
import { getChallengeParams, verifyChallengeOnBackend } from "../../chain/backend_connectors"
import { BlockinUIDisplay } from 'blockin/dist/ui';
import { ChallengeParams, constructChallengeObjectFromString, SignAndVerifyChallengeResponse, SupportedChainMetadata } from 'blockin';
import { PRIMARY_TEXT } from "../../constants";
import { Address } from "../old/Address";
import Blockies from 'react-blockies'
import { Avatar, Typography } from "antd";
import Image from 'next/image';

const { Text } = Typography;

export const BlockinDisplay = () => {
    const {
        chain,
        setChain,
        loggedIn,
        setLoggedIn,
        connect,
        disconnect,
        address,
        signChallenge,
        selectedChainInfo,
        displayedResources,
        connected
    } = useChainContext();

    const [challengeParams, setChallengeParams] = useState({
        domain: 'https://blockin.com',
        statement: 'Sign in to this website via Blockin. You will remain signed in until you terminate your browser session.',
        address: address,
        uri: 'https://blockin.com/login',
        nonce: 'Default Nonce'
    });

    /**
     * Update challengeParams when address or chain changes
     */
    useEffect(() => {
        updateChallengeParams();
    }, []);

    useEffect(() => {
        updateChallengeParams();
    }, [chain, address]);

    const updateChallengeParams = async () => {
        const challengeParams = await getChallengeParams(chain, address);
        setChallengeParams(challengeParams);
    }

    const handleSignChallenge = async (challenge: string) => {
        const response = await signChallenge(challenge);
        return response;
    }

    const handleVerifyChallenge = async (originalBytes: Uint8Array, signatureBytes: Uint8Array, challengeObj?: ChallengeParams) => {
        const verificationResponse = await verifyChallengeOnBackend(chain, originalBytes, signatureBytes);

        if (!verificationResponse.verified) {
            return { success: false, message: `${verificationResponse.message}` }
        }
        else {
            /**
             * At this point, the user has been verified by your backend and Blockin. Here, you will do anything needed
             * on the frontend to grant the user access such as setting loggedIn to true, adding cookies, or 
             * anything else that needs to be updated.
             */
            //TODO: cookies 
            alert(verificationResponse.message);
            setLoggedIn(true);
            return {
                success: true, message: `${verificationResponse.message}`
            }
        }
    }

    const signAndVerifyChallenge = async (challenge: string) => {
        const signChallengeResponse: SignChallengeResponse = await handleSignChallenge(challenge);
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
            setChain(newChainMetadata.name);
        }
    }

    const logout = async () => {
        setLoggedIn(false);
    }

    //TODO: Better address display (hideChainName? )
    return <>
        <div style={{ display: 'flex', justifyContent: 'center', color: `${PRIMARY_TEXT}` }}>
            {
                <BlockinUIDisplay
                    connected={connected}
                    connect={async () => {
                        connect();
                    }}
                    buttonStyle={undefined}
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
                        // { name: 'BSC' },
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
        <div>
            <Avatar
                size={200}
                src={
                    address ? <Blockies
                        seed={address.toLowerCase()}
                        size={100}
                    /> : <Image src="/images/bitbadgeslogo.png" alt="BitBadges Logo" height={'200%'} width={'200%'} />
                }
                style={{ marginTop: 40 }}
            />


        </div>
        <div> {address && <Address address={address} fontColor={PRIMARY_TEXT} fontSize={36} />}</div>
        <div> {address && <Text
            strong
            style={{ fontSize: 30, color: PRIMARY_TEXT }}
        >
            {loggedIn ? 'Signed In' : 'Not Signed In'}
        </Text>}</div>
    </>;
}