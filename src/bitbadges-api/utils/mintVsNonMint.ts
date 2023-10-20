import { BitBadgesCollection, CollectionApprovalWithDetails, getReservedAddressMapping, isAddressMappingEmpty, isInAddressMapping, removeAddressMappingFromAddressMapping } from "bitbadgesjs-utils";

export const getNonMintApprovals = (collection: BitBadgesCollection<bigint>) => {
  let firstMatches = collection?.collectionApprovals.length > 0 ? collection?.collectionApprovals ?? [] : []
  const existingNonMint = firstMatches.map(x => {
    if (isInAddressMapping(x.fromMapping, "Mint")) {
      if (x.fromMappingId === 'AllWithMint') {
        return {
          ...x,
          fromMapping: getReservedAddressMapping('AllWithoutMint'),
          fromMappingId: 'AllWithoutMint'
        }
      }


      const [remaining] = removeAddressMappingFromAddressMapping(getReservedAddressMapping('Mint'), x.fromMapping);

      if (isAddressMappingEmpty(remaining)) {
        return undefined;
      }

      let newMappingId = remaining.includeAddresses ? "" : "AllWithout"
      newMappingId += remaining.addresses.join(":");

      return {
        ...x,
        fromMapping: remaining,
        fromMappingId: newMappingId
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
        fromMapping: getReservedAddressMapping('Mint'),
        fromMappingId: 'Mint',
      }
    } else {
      return undefined;
    }
  }).filter(x => x !== undefined) as CollectionApprovalWithDetails<bigint>[];

  return newApprovals;
}