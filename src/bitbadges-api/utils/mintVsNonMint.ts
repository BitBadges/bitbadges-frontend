import { AddressMapping } from "bitbadgesjs-proto";
import { BitBadgesCollection, CollectionApprovalWithDetails, getReservedAddressMapping, isAddressMappingEmpty, isInAddressMapping, removeAddressMappingFromAddressMapping } from "bitbadgesjs-utils";

export const getNonMintApprovals = (collection: BitBadgesCollection<bigint>, throwOnUnresolvableId?: boolean) => {
  let firstMatches = collection?.collectionApprovals.length > 0 ? collection?.collectionApprovals ?? [] : []
  const existingNonMint = firstMatches.map(x => {
    if (isInAddressMapping(x.fromMapping, "Mint")) {
      if (x.fromMappingId === 'AllWithMint') {
        return {
          ...x,
          fromMapping: getReservedAddressMapping('AllWithoutMint') as AddressMapping,
          fromMappingId: 'AllWithoutMint'
        }
      }


      const [remaining] = removeAddressMappingFromAddressMapping(getReservedAddressMapping('Mint') as AddressMapping, x.fromMapping);

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
  }).filter(x => x !== undefined) as CollectionApprovalWithDetails<bigint>[];

  return existingNonMint;
}

export const getMintApprovals = (collection: BitBadgesCollection<bigint>) => {
  let firstMatches = collection?.collectionApprovals.length > 0 ? collection?.collectionApprovals ?? [] : []
  const newApprovals = firstMatches.map(x => {
    if (isInAddressMapping(x.fromMapping, "Mint")) {
      return {
        ...x,
        fromMapping: getReservedAddressMapping('Mint') as AddressMapping,
        fromMappingId: 'Mint',
      }
    } else {
      return undefined;
    }
  }).filter(x => x !== undefined) as CollectionApprovalWithDetails<bigint>[];

  return newApprovals;
}