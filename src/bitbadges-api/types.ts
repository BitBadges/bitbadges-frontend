/**
 * @category Base
 */
export enum TransactionStatus {
  None = 0,
  AwaitingSignatureOrBroadcast = 1
}

/**
 * DistributionMethod is used to determine how badges are distributed.
 *
 * @typedef {string} DistributionMethod
 * @enum {string}
 *
 * @property {string} None - No distribution method is set
 * @property {string} FirstComeFirstServe - Badges are distributed on a first come first serve basis
 * @property {string} Whitelist - Badges are distributed to a whitelist of addresses
 * @property {string} Codes - Badges are distributed to addresses that have a code / password
 * @property {string} Unminted - Do nothing. Badges are not distributed.
 * @property {string} JSON - Upload a JSON file to specify how to distribute badges
 * @property {string} DirectTransfer - Transfer badges directly to users (no claim)
 *
 * @category Base
 */
export enum DistributionMethod {
  None = 'None',
  FirstComeFirstServe = 'First Come First Serve',
  Whitelist = 'Whitelist',
  Codes = 'Codes',
  Unminted = 'Unminted',
  JSON = 'JSON',
  DirectTransfer = 'Direct Transfer',
  OffChainBalances = 'Off-Chain Balances'
}

/**
 * MetadataAddMethod is used to determine how metadata is entered.
 *
 * @typedef {string} MetadataAddMethod
 *
 * Manual: Manually enter the metadata for each badge
 * UploadUrl: Enter a URL that will be used to fetch the metadata for each badge
 * CSV: Upload a CSV file that will be used to fetch the metadata for each badge
 *
 * @category Base
 */
export enum MetadataAddMethod {
  None = 'None',
  Manual = 'Manual',
  UploadUrl = 'Insert Custom Metadata Url (Advanced)',
  Plugins = 'Plugins'
}
