import { AddressMapping } from "bitbadgesjs-proto";
import { BitBadgesCollection, CollectionApprovedTransferWithDetails, getReservedAddressMapping, isAddressMappingEmpty, isInAddressMapping, removeAddressMappingFromAddressMapping } from "bitbadgesjs-utils";

export const getNonMintApprovedTransfers = (collection: BitBadgesCollection<bigint>, throwOnUnresolvableId?: boolean) => {
  let firstMatches = collection?.collectionApprovedTransfers.length > 0 ? collection?.collectionApprovedTransfers ?? [] : []
  const existingNonMint = firstMatches.map(x => {
    if (isInAddressMapping(x.fromMapping, "Mint")) {
      if (x.fromMappingId === 'AllWithMint') {
        return {
          ...x,
          fromMapping: getReservedAddressMapping('AllWithoutMint', '') as AddressMapping,
          fromMappingId: 'AllWithoutMint'
        }
      }


      const [remaining] = removeAddressMappingFromAddressMapping(getReservedAddressMapping('Mint', '') as AddressMapping, x.fromMapping);

      if (isAddressMappingEmpty(remaining)) {
        return undefined;
      }

      if (throwOnUnresolvableId) throw new Error('Not implemented. Could not resolve mapping ID after removing Mint address from fromMapping');

      return {
        ...x,
        fromMapping: remaining,
        fromMappingId: ''
      }
    } else {
      return x;
    }
  }).filter(x => x !== undefined) as CollectionApprovedTransferWithDetails<bigint>[];

  return existingNonMint;
}

export const getMintApprovedTransfers = (collection: BitBadgesCollection<bigint>) => {
  let firstMatches = collection?.collectionApprovedTransfers.length > 0 ? collection?.collectionApprovedTransfers ?? [] : []
  const newApprovedTransfers = firstMatches.map(x => {
    if (isInAddressMapping(x.fromMapping, "Mint")) {
      return {
        ...x,
        fromMapping: getReservedAddressMapping('Mint', '') as AddressMapping,
        fromMappingId: 'Mint',
      }
    } else {
      return undefined;
    }
  }).filter(x => x !== undefined) as CollectionApprovedTransferWithDetails<bigint>[];

  return newApprovedTransfers;
}