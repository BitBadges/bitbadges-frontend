import { Secp256k1 } from "@cosmjs/crypto"
import {
  disconnect as disconnectWeb3,
  signMessage,
  signTypedData,
} from "@wagmi/core"
import { useWeb3Modal } from "@web3modal/wagmi/react"

import { notification } from "antd"
import {
  BigIntify,
  SupportedChain,
  createTxRawEIP712,
  signatureToWeb3Extension,
} from "bitbadgesjs-proto"
import { Numberify, convertToCosmosAddress } from "bitbadgesjs-utils"
import { ethers } from "ethers"
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useCookies } from "react-cookie"
import { useAccount as useWeb3Account } from "wagmi"
import { CHAIN_DETAILS } from "../../../constants"
import { checkIfSignedIn } from "../../api"

import { ChainSpecificContextType } from "../ChainContext"
import { setPublicKey, useAccount } from "../accounts/AccountsContext"
import { fetchDefaultViews } from "./helpers"
import { constructChallengeObjectFromString } from "blockin"

export type EthereumContextType = ChainSpecificContextType & {
  signer?: ethers.providers.JsonRpcSigner
  setSigner: Dispatch<
    SetStateAction<ethers.providers.JsonRpcSigner | undefined>
  >
}

export const EthereumContext = createContext<EthereumContextType>({
  address: "",
  connect: async () => { },
  disconnect: async () => { },
  signChallenge: async () => {
    return { message: "", signature: "" }
  },
  loggedInExpiration: 0,
  getPublicKey: async () => {
    return ""
  },
  signTxn: async () => { },
  selectedChainInfo: {},
  connected: false,
  setConnected: () => { },
  signer: undefined,
  setSigner: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
})

type Props = {
  children?: React.ReactNode
}

export const EthereumContextProvider: React.FC<Props> = ({ children }) => {
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const [cookies, setCookies] = useCookies(["blockincookie", "pub_key"])
  const [loggedIn, setLoggedIn] = useState<boolean>(false)
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0)
  const { open } = useWeb3Modal()
  const web3AccountContext = useWeb3Account()
  const address = web3AccountContext.address || ""
  const cosmosAddress = convertToCosmosAddress(address)
  const connected = web3AccountContext.address ? true : false
  const [loggedInExpiration, setLoggedInExpiration] = useState<number>(0)
  const setConnected = () => { }
  const account = useAccount(cosmosAddress)

  const selectedChainInfo = {}

  const connect = async () => {
    await connectAndPopulate(
      web3AccountContext.address ?? "",
      cookies.blockincookie
    )
  }

  const connectAndPopulate = useCallback(
    async (address: string, cookie: string) => {
      if (!address) {
        try {
          await open()
        } catch (e) {
          notification.error({
            message: "Error connecting to wallet",
            description:
              "Make sure you have a compatible Ethereum wallet installed (such as MetaMask) and that you are signed in to it.",
          })
        }
      } else if (address) {
        let loggedIn = false
        if (cookie === convertToCosmosAddress(address)) {
          const signedInRes = await checkIfSignedIn({})
          setLoggedIn(signedInRes.signedIn)
          loggedIn = signedInRes.signedIn
          if (signedInRes.message) {
            const params = constructChallengeObjectFromString(signedInRes.message, BigIntify)
            setLoggedInExpiration(params.expirationDate ? new Date(params.expirationDate).getTime() : 0);
          }
        } else {
          setLoggedIn(false)
        }

        if (loggedIn) {
          setLastSeenActivity(Date.now())
        }

        await fetchDefaultViews(address, loggedIn)
      }
    },
    [open]
  )

  useEffect(() => {
    if (web3AccountContext.address) {
      connectAndPopulate(web3AccountContext.address, cookies.blockincookie)
    }
  }, [web3AccountContext.address, loggedIn])

  const disconnect = async () => {
    setLoggedIn(false)
    await disconnectWeb3()
  }

  const signChallenge = async (message: string) => {
    const sign = await signMessage({
      message: message,
    })

    const msgHash = ethers.utils.hashMessage(message)
    const msgHashBytes = ethers.utils.arrayify(msgHash)
    const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sign)

    const pubKeyHex = pubKey.substring(2)
    const compressedPublicKey = Secp256k1.compressPubkey(
      new Uint8Array(Buffer.from(pubKeyHex, "hex"))
    )
    const base64PubKey = Buffer.from(compressedPublicKey).toString("base64")
    setPublicKey(cosmosAddress, base64PubKey)
    setCookies("pub_key", `${cosmosAddress}-${base64PubKey}`, { path: "/" })

    return {
      message,
      signature: sign,
    }
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    if (!account) throw new Error("Account not found.")

    const chain = { ...CHAIN_DETAILS, chain: SupportedChain.ETH }
    const sender = {
      accountAddress: cosmosAddress,
      sequence: account.sequence ? Numberify(account.sequence) : 0,
      accountNumber: Numberify(account.accountNumber),
      pubkey: account.publicKey,
    }
    let sig = ""
    if (!simulate) {
      console.log(txn.eipToSign)

      sig = await signTypedData({
        message: txn.eipToSign.message,
        types: txn.eipToSign.types,
        domain: txn.eipToSign.domain,
        primaryType: txn.eipToSign.primaryType,
      })
    }

    let txnExtension = signatureToWeb3Extension(chain, sender, sig)

    // Create the txRaw
    let rawTx = createTxRawEIP712(
      txn.legacyAmino.body,
      txn.legacyAmino.authInfo,
      txnExtension
    )

    return rawTx
  }

  const getPublicKey = async (_cosmosAddress: string) => {
    try {
      const currAccount = account

      //If we have stored the public key in cookies, use that instead (for Ethereum)
      if (
        currAccount &&
        cookies.pub_key &&
        cookies.pub_key.split("-")[0] === currAccount.cosmosAddress
      ) {
        return cookies.pub_key.split("-")[1]
      }

      if (currAccount && currAccount.publicKey) {
        return currAccount.publicKey
      }

      const message =
        "Hello! We noticed that you haven't interacted the BitBadges blockchain yet. To interact with the BitBadges blockchain, we need your PUBLIC key for your address to allow us to generate transactions.\n\nPlease kindly sign this message to allow us to compute your public key.\n\nThis message is not a blockchain transaction and signing this message has no purpose other than to compute your public key.\n\nThanks for your understanding!"

      const sig = await signMessage({
        message: message,
      })

      const msgHash = ethers.utils.hashMessage(message)
      const msgHashBytes = ethers.utils.arrayify(msgHash)
      const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sig)

      const pubKeyHex = pubKey.substring(2)
      const compressedPublicKey = Secp256k1.compressPubkey(
        new Uint8Array(Buffer.from(pubKeyHex, "hex"))
      )
      const base64PubKey = Buffer.from(compressedPublicKey).toString("base64")
      setPublicKey(_cosmosAddress, base64PubKey)
      setCookies("pub_key", `${_cosmosAddress}-${base64PubKey}`, { path: "/" })

      return base64PubKey
    } catch (e) {
      console.log(e)
      return ""
    }
  }

  const ethereumContext: EthereumContextType = {
    connected,
    setConnected,
    connect,
    disconnect,
    selectedChainInfo,
    signChallenge,
    signTxn,
    address,
    signer,
    setSigner,
    getPublicKey,
    loggedIn,
    setLoggedIn,
    lastSeenActivity,
    setLastSeenActivity,
    loggedInExpiration,
  }

  return (
    <EthereumContext.Provider value={ethereumContext}>
      {children}
    </EthereumContext.Provider>
  )
}

export const useEthereumContext = () => useContext(EthereumContext)
