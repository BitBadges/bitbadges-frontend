import { AddressMapping } from "bitbadgesjs-proto";
import { convertToCosmosAddress } from "bitbadgesjs-utils";

export const getReservedMappingId = (addressMapping: AddressMapping): string => {
  let mappingId = '';

  // Logic to determine the mappingId based on the properties of addressMapping
  if (addressMapping.includeAddresses) {
    if (addressMapping.addresses.length > 0) {
      const addresses = addressMapping.addresses.map(x => convertToCosmosAddress(x)).join(':');
      mappingId = `${addresses}`;
    } else {
      mappingId = 'None';
    }
  } else {
    if (addressMapping.addresses.length > 0) {
      const addresses = addressMapping.addresses.map(x => convertToCosmosAddress(x)).join(':');
      mappingId = `AllWithout${addresses}`;
    } else {
      mappingId = 'All';
    }
  }

  return mappingId;
}