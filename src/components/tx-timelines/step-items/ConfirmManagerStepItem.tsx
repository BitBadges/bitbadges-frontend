import { ConfirmManager } from "../form-items/ConfirmManager";

export function ConfirmManagerStepItem() {
    return {
        title: 'Confirm Manager',
        description: 'Every badge needs a manager. For these badge(s), your address below will be the manager.',
        node: <ConfirmManager />
    }
}