//TODO: add this to bitbadges-js
import { type } from 'os';

export const NUM_PERMISSIONS = 8;

export type Permissions = {
    CanUpdateBytes: boolean;
    CanManagerTransfer: boolean;
    CanUpdateUris: boolean;
    ForcefulTransfers: boolean;
    CanCreate: boolean;
    CanRevoke: boolean;
    CanFreeze: boolean;
    FrozenByDefault: boolean;
}

export const CanUpdateBytesDigit = 8
export const CanManagerTransferDigit = 7
export const CanUpdateUrisDigit = 6
export const ForcefulTransfersDigit = 5
export const CanCreateDigit = 4
export const CanRevokeDigit = 3
export const CanFreezeDigit = 2
export const FrozenByDefaultDigit = 1

export function ValidatePermissions(permissions: number) {
    let tempPermissions = permissions >> NUM_PERMISSIONS;
    if (tempPermissions != 0) {
        throw 'Invalid permissions: Leading Zeroes';
    }
}

export function ValidatePermissionsUpdate(oldPermissions: number, newPermissions: number) {
    try {
        ValidatePermissions(oldPermissions);
        ValidatePermissions(newPermissions);
    } catch (error) {
        throw error;
    }

    let oldFlags = GetPermissions(oldPermissions);
    let newFlags = GetPermissions(newPermissions);

    if (!oldFlags.CanUpdateBytes && newFlags.CanUpdateBytes) {
        throw 'Invalid permissions: Updating CanUpdateBytes is locked';
    }

    if (!oldFlags.CanUpdateUris && newFlags.CanUpdateUris) {
        throw 'Invalid permissions: Updating CanUpdateUris is locked';
    }

    if (!oldFlags.CanCreate && newFlags.CanCreate) {
        throw 'Invalid permissions: Updating CanCreate is locked';
    }

    if (!oldFlags.CanRevoke && newFlags.CanRevoke) {
        throw 'Invalid permissions: Updating CanRevoke is locked';
    }

    if (!oldFlags.CanFreeze && newFlags.CanFreeze) {
        throw 'Invalid permissions: Updating CanFreeze is locked';
    }

    if (!oldFlags.CanManagerTransfer && newFlags.CanManagerTransfer) {
        throw 'Invalid permissions: Updating CanManagerTransfer is locked';
    }

    if (oldFlags.ForcefulTransfers != newFlags.ForcefulTransfers) {
        throw 'Invalid permissions: Updating ForcefulTransfers is permanently locked';
    }

    if (oldFlags.FrozenByDefault != newFlags.FrozenByDefault) {
        throw 'Invalid permissions: Updating FrozenByDefault is permanently locked';
    }
}

//IMPORTANT: No validity checks done
export function UpdatePermissions(currPermissions: number, permissionDigit: number, value: boolean) {
    if (permissionDigit > NUM_PERMISSIONS || permissionDigit <= 0) {
        throw 'Invalid permission digit';
    }

    let mask = 1 << (permissionDigit - 1);
    let masked_n = currPermissions & mask;
    let bit = masked_n >> (permissionDigit - 1);
    let bit_as_bool = bit == 1;

    if (value != bit_as_bool) {
        if (bit_as_bool) {
            currPermissions -= 2 ** (permissionDigit - 1);
        } else {
            currPermissions += 2 ** (permissionDigit - 1);
        }
    }

    return currPermissions;
}

export function GetPermissions(permissions: number) {
    let permissionFlags: any = {};
    for (let i = 0; i <= NUM_PERMISSIONS; i++) {
        let mask = 1 << i;
        let masked_n = permissions & mask;
        let bit = masked_n >> i;
        let bit_as_bool = bit == 1;
        switch (i + 1) {
            case CanUpdateBytesDigit:
                permissionFlags.CanUpdateBytes = bit_as_bool;
                break;
            case CanManagerTransferDigit:
                permissionFlags.CanManagerTransfer = bit_as_bool;
                break;
            case CanUpdateUrisDigit:
                permissionFlags.CanUpdateUris = bit_as_bool;
                break;
            case ForcefulTransfersDigit:
                permissionFlags.ForcefulTransfers = bit_as_bool;
                break;
            case CanCreateDigit:
                permissionFlags.CanCreate = bit_as_bool;
                break;
            case CanRevokeDigit:
                permissionFlags.CanRevoke = bit_as_bool;
                break;
            case CanFreezeDigit:
                permissionFlags.CanFreeze = bit_as_bool;
                break;
            case FrozenByDefaultDigit:
                permissionFlags.FrozenByDefault = bit_as_bool;
                break;
            default:
                break;
        }
    }
    return permissionFlags as Permissions
}