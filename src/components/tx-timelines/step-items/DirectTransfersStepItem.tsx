import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { MessageGenerated, MsgTransferBadges, MsgUniversalUpdateCollection, convertMsgTransferBadges, convertMsgUniversalUpdateCollection, createProtoMsg, createTransactionPayload } from "bitbadgesjs-proto";
import { MsgTransferBadges as ProtoMsgTransferBadges, MsgUniversalUpdateCollection as ProtoMsgUniversalUpdateCollection } from 'bitbadgesjs-proto/dist/proto/badges/tx_pb';
import { convertToCosmosAddress, generatePostBodyBroadcast, getTransfersFromTransfersWithIncrements, isInAddressList } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { simulateTx } from "../../../bitbadges-api/api";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { useAccount } from "../../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { CHAIN_DETAILS } from "../../../constants";
import { TransferSelect } from "../../transfers/TransferOrClaimSelect";
import { TxInfo } from "../../tx-modals/TxModal";
import { ErrDisplay } from "../../common/ErrDisplay";
import { GenericFormStepWrapper } from "../form-items/GenericFormStepWrapper";

export function DirectTransfersStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);

  const [err, setErr] = useState<Error | string | null>(null);

  if (!collection) return EmptyStepItem;
  if (collection.balancesType !== 'Standard') return EmptyStepItem;
  if (collection.owners.find(owner => owner.cosmosAddress === 'Mint')?.balances.length === 0) return EmptyStepItem;

  return {
    title: `Direct Mints`,
    description: 'If you would like to directly mint some badges to users now, you can do so here. All mints must satisfy approvals (collection, sender, and recipient) where applicable. These transfers will be from the Mint address and initiated (approved) by your address.',
    node: () => <GenericFormStepWrapper
      documentationLink="https://docs.bitbadges.io/overview/how-it-works/distribution"
      node={() => <DirectTransfersNode err={err} setErr={setErr} />}
    />,
    disabled: !collection || !!err,
  }
}

//Keep everything self-contained in this component so we only load it when visible
//This is so it doesn't simulate every time the user changes the dependency fields in other steps
export const DirectTransfersNode = ({ err, setErr }: { err: Error | string | null, setErr: (err: Error | string | null) => void }) => {
  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(NEW_COLLECTION_ID);
  const chain = useChainContext();
  const signedInAccount = useAccount(chain.cosmosAddress);

  useEffect(() => {
    async function simulate() {
      setErr(null);
      if (collection?.balancesType !== 'Standard') return;
      if (collection?.owners.find(owner => owner.cosmosAddress === 'Mint')?.balances.length === 0) return;
      if (!signedInAccount) return;
      if (txTimelineContext.transfers.length === 0) return;

      //Simulate the creation + mint txs to see if they return an error

      //Shortened msg bc this is all we care ab for transfers
      const msg: MsgUniversalUpdateCollection<bigint> = {
        creator: chain.cosmosAddress,
        collectionId: txTimelineContext.existingCollectionId ?? 0n,
        badgesToCreate: txTimelineContext.badgesToCreate,
        balancesType: collection?.balancesType ?? "",
        updateCollectionApprovals: true,
        collectionApprovals: collection?.collectionApprovals ?? [],
        defaultBalances: collection?.defaultBalances ?? {
          balances: [],
          incomingApprovals: [],
          outgoingApprovals: [],
          autoApproveSelfInitiatedIncomingTransfers: true,
          autoApproveSelfInitiatedOutgoingTransfers: true,
          userPermissions: {
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
          }
        },
      }
      const txsInfo: TxInfo[] = [
        {
          type: 'MsgUniversalUpdateCollection',
          msg: msg,
          generateProtoMsg: ((msg: MsgUniversalUpdateCollection<bigint>) => {
            return new ProtoMsgUniversalUpdateCollection(convertMsgUniversalUpdateCollection(msg, String))
          }) as any,
        }
      ]

      if (txTimelineContext.transfers.length > 0 && collection?.balancesType === 'Standard') {
        txsInfo.push({
          type: 'MsgTransferBadges',
          msg: {
            creator: chain.cosmosAddress,
            collectionId: txTimelineContext.existingCollectionId ?? 0n,
            transfers: getTransfersFromTransfersWithIncrements(txTimelineContext.transfers).map(x => {
              return {
                ...x,
                toAddresses: x.toAddresses.map(y => convertToCosmosAddress(y))
              }
            })
          },
          generateProtoMsg: ((msg: MsgTransferBadges<bigint>) => {
            return new ProtoMsgTransferBadges(convertMsgTransferBadges(msg, String))
          }) as any,
        });
      }

      try {
        if (!signedInAccount) return;

        const generatedMsgs: MessageGenerated[] = []
        for (const tx of txsInfo) {
          const { generateProtoMsg, msg } = tx;
          if (!generateProtoMsg) continue;
          generatedMsgs.push(createProtoMsg(generateProtoMsg(msg)))
        }

        const unsignedTxSimulated = await createTransactionPayload({
          chain: {
            ...CHAIN_DETAILS,
            chain: chain.chain as any,
          },
          sender: {
            accountAddress: signedInAccount?.cosmosAddress,
            sequence: Number(signedInAccount?.sequence ?? "0"),
            accountNumber: Number(signedInAccount?.accountNumber ?? "0"),
            pubkey: signedInAccount?.publicKey ?? "",
          },
          fee: {
            amount: `0`,
            denom: 'badge',
            gas: `100000000000`,
          },
          memo: '',
        }, generatedMsgs);


        console.log(unsignedTxSimulated);
        const rawTxSimulated = await chain.signTxn(unsignedTxSimulated, true);
        const simulatedTx = await simulateTx(generatePostBodyBroadcast(rawTxSimulated));
        console.log(simulatedTx);
        setErr(null);
      } catch (e: any) {
        console.log(e);
        if (e?.response?.data?.message) {
          setErr(e.response.data.message);
        } else if (e?.message) {
          setErr(e.message)
        } else {
          setErr("Unknown error")
        }
      }
    }

    simulate();
  }, [
    collection?.balancesType,
    collection?.owners,
    collection?.collectionApprovals,
    collection?.defaultBalances,
    chain, signedInAccount,
    txTimelineContext.transfers, txTimelineContext.existingCollectionId,
    txTimelineContext.badgesToCreate,
    setErr
  ])


  if (!collection) return <></>;
  if (collection.balancesType !== 'Standard') return <></>;
  if (collection.owners.find(owner => owner.cosmosAddress === 'Mint')?.balances.length === 0) return <></>;

  const hasManagerApproval = collection.collectionApprovals.some(x =>
    isInAddressList(x.fromList, 'Mint') && isInAddressList(x.initiatedByList, chain.cosmosAddress)
    && x.transferTimes.some(y => y.start <= BigInt(Date.now()) && y.end >= BigInt(Date.now()))
  );

  const DistributionComponent = <div>
    <TransferSelect
      collectionId={NEW_COLLECTION_ID}
      sender="Mint"
      transfers={txTimelineContext.transfers}
      setTransfers={txTimelineContext.setTransfers}
      plusButton
      originalSenderBalances={collection.owners.find(owner => owner.cosmosAddress === 'Mint')?.balances ?? []}
      showApprovalsMessage
    />
  </div>
  return <>
    {err && <>
      <ErrDisplay err={err} />
      <br /></>}
    {collection.defaultBalances.incomingApprovals.length == 0 && <>
      <ErrDisplay warning err={"The default incoming approvals set (opt-in only) do not allow transfers from the Mint address. Any direct mint must satisfy a collection approval that overrides incoming approvals."} />
    </>}
    {!hasManagerApproval && <>
      <ErrDisplay warning err={"The collection approvals set do not specify an approval that allows a transfer from the Mint address, inititated by your address, and is valid at the current moment."} />
      <br />
    </>}
    {
      DistributionComponent
    }
  </>
}