export function parseId(partitionedAddress: string) {
    const chain = partitionedAddress.split(':')[0];
    const address = partitionedAddress.split(':')[1];

    return { chain, address };
}

export function getChainFromPartitionedAddress(partitionedAddress: string) {
    return partitionedAddress.split(':')[0];
}

export function getAddressFromPartitionedAddress(partitionedAddress: string) {
    return partitionedAddress.split(':')[1];
}

export function getAbbreviatedAddress(address: string) {
    return address.substring(0, 5) + '...' + address.substring(address.length - 4, address.length);
}
