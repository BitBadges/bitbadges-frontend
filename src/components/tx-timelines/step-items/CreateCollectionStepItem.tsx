import { SubmitMsgNewCollection } from '../form-items/SubmitMsgUniversalUpdateCollection';

export function CreateCollectionStepItem() {
  return {
    title: 'Submit Transaction',
    description: '',
    node: () => <SubmitMsgNewCollection />
  };
}
