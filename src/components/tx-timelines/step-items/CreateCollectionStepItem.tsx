import { MsgUpdateCollection } from "bitbadgesjs-proto";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgUpdateCollection";
import { MsgUpdateCollectionProps } from "../TxTimeline";

export function CreateCollectionStepItem(
  txState: MsgUpdateCollectionProps,
  collectionId?: bigint,

) {
  return {
    title: 'Submit Transaction',
    description: '',
    node: <SubmitMsgNewCollection
      collectionId={collectionId}
      txState={txState}
    />
  }
}