import { SubmitMsgNewCollection } from "../form-items/SubmitMsgUpdateCollection";

export function CreateCollectionStepItem(
  collectionId?: bigint,

) {
  return {
    title: 'Submit Transaction',
    description: '',
    node: <SubmitMsgNewCollection
      collectionId={collectionId}
    />
  }
}