/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import { useChainContext } from "../chain_handlers_frontend/ChainContext"
import { getChallengeParams, verifyChallengeOnBackend } from "../chain_handlers_frontend/backend_connectors"
import { SignInWithBlockinButton } from 'blockin/dist/ui';
import { ChallengeParams, generateNonceWithLastBlockTimestamp, SupportedChain } from 'blockin';
import { signChallengeEth } from "../chain_handlers_frontend/ethereum/sign_challenge";
import { connect as algorandConnect } from "../chain_handlers_frontend/algorand/WalletConnect";
import { useAlgorandContext } from "../chain_handlers_frontend/algorand/AlgorandContext";
import { signChallengeAlgo } from "../chain_handlers_frontend/algorand/sign_challenge";

const loadingMessage = <>
    <p>Go to your wallet and accept the challenge request...</p>
</>

const successMessage = <>
    <p>Challenge succeeded!</p>
    <p>You are now authenticated.</p>
    <p>If you specified a banner privilege, you should see the banner at the top of this page change!</p>
</>

const failureMessage = <>
    <p>Challenge failed!</p>
    <p>You are NOT authenticated</p>
</>

declare var window: any;

export const SignChallengeButton = () => {
    const [userIsSigningChallenge, setUserIsSigningChallenge] = useState(false);
    const [displayMessage, setDisplayMessage] = useState(loadingMessage);
    const {
        connector,
        setConnector
    } = useAlgorandContext();
    const {
        connect,
        disconnect,
        ownedAssetIds,
        address,
        setConnect,
        signChallenge,
        setDisconnect,
        setDisplayedAssets,
        setDisplayedUris,
        setCurrentChainInfo,
        setSignChallenge,
        setOwnedAssetIds,
        displayedAssets,
        displayedUris,
        chain,
        setChain,
        setAddress,
        connected,
        setConnected,
        loggedIn,
        setLoggedIn
    } = useChainContext();

    const [challengeParams, setChallengeParams] = useState({
        domain: 'https://blockin.com',
        statement: 'Sign in to this website via Blockin. You will remain signed in until you terminate your browser session.',
        address: address,
        uri: 'https://blockin.com/login',
        nonce: 'Default Nonce'
    });

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
        setUserIsSigningChallenge(true);
        setDisplayMessage(loadingMessage);

        const response = await signChallenge(challenge);
        return response;
    }

    const handleVerifyChallenge = async (originalBytes: Uint8Array, signatureBytes: Uint8Array, challengeObj: ChallengeParams) => {

        const verificationResponse = await verifyChallengeOnBackend(chain, originalBytes, signatureBytes);

        if (!verificationResponse.verified) {
            setDisplayMessage(failureMessage);
            setUserIsSigningChallenge(false);
            return { success: false, message: `${verificationResponse.message}` }
        }
        else {
            /**
             * At this point, the user has been verified by your backend. Here, you will do anything needed
             * on the frontend to grant the user access such as setting loggedIn to true, adding cookies, or 
             * anything else that needs to be updated.
             */


            setDisplayMessage(successMessage);
            alert(verificationResponse.message);
            setLoggedIn(true);
            return {
                success: true, message: `${verificationResponse.message}`
            }
        }
    }

    /**
    * This is where the chain details in ChainContext are updated upon a new chain being selected.
    */
    const handleUpdateChain = async (newChainProps: SupportedChain) => {
        setConnected(false);
        console.log(newChainProps.name);
        setAddress('');
        if (newChainProps.name === 'Ethereum') {
            setChain('Ethereum');
            //TODO: I know this isn't the right way to do this but it works
            const connectFunction = () => {
                return async () => {
                    console.log("asfjhaksdfhjk");
                    let accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    console.log(accounts);
                    if (accounts[0]) {
                        setAddress(accounts[0]);
                        setConnected(true);
                    }
                }
            }
            setConnect(connectFunction);
            setDisconnect(() => {
                return async () => {
                    await logout();
                    setAddress('');
                    setConnected(false);
                }
            });
            setSignChallenge(() => async (challenge: string) => {
                return signChallengeEth(challenge);
            });
            setDisplayedAssets([]);
            setDisplayedUris([]);
            setOwnedAssetIds([]);
        } else if (newChainProps.name.startsWith('Algorand')) {

            setChain(newChainProps.name);
            //TODO: I know this isn't the right way to do this but it works
            setConnect(() => async () => {
                algorandConnect(setConnector, setAddress, setConnected);
            });
            setDisconnect(() => async () => {
                await logout();
                await connector?.killSession({ message: 'bye' })
                connector?.rejectSession({ message: 'bye' })
                setConnector(undefined)
                setAddress('')
                setConnected(false);
            });
            setSignChallenge(() => async (challenge: string) => {
                if (connector) return signChallengeAlgo(connector, challenge, newChainProps.name === 'Algorand Testnet');
                else throw 'Error signing challenge'
            });
            setDisplayedAssets([]);
            setDisplayedUris([]);
            setOwnedAssetIds([]);
        }
    }

    const logout = async () => {
        setLoggedIn(false);
    }

    return <>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            {
                <SignInWithBlockinButton
                    connected={connected}
                    connect={async () => {
                        connect()
                    }}
                    disconnect={async () => {
                        disconnect()
                    }}
                    chainOptions={[
                        //These should match what ChainDrivers are implemented in your backend.
                        {
                            name: 'Ethereum'
                        },
                        {
                            name: 'Algorand Testnet',
                        },
                        {
                            name: 'Algorand Mainnet',
                        },
                    ]}
                    onChainUpdate={handleUpdateChain}
                    challengeParams={challengeParams}
                    loggedIn={loggedIn}
                    logout={async () => {
                        await logout();
                        setLoggedIn(false);
                    }}
                    currentChain={chain}
                    displayedAssets={[]}
                    signChallenge={handleSignChallenge}
                    verifyChallengeOnBackend={handleVerifyChallenge}
                    canAddCustomAssets={false}
                />
            }
        </div>
        <div style={{ textAlign: 'center' }}>
            Address: {address ? address : 'None'}
        </div>

        {/* {userIsSigningChallenge && displayMessage} */}
    </>;
}