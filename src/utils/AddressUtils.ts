export function getAbbreviatedAddress(address: string) {
    return address.substring(0, 10) + '...' + address.substring(address.length - 4, address.length);
}
