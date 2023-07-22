import { ConfirmManager } from "../form-items/ConfirmManager";

export function ConfirmManagerStepItem() {
  return {
    title: 'Confirm Manager',
    description: 'Every badge collection needs a manager. For this collection, your address below will be the manager.',
    node: <ConfirmManager />
  }
}