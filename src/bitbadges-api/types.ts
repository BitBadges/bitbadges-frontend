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
 *
 * @category Base
 */
export enum DistributionMethod {
  None = 'None',
  Tally = 'Tally',
  AllOrNothing = 'AllOrNothing',
  NoLimi = 'NoLimit',
  Whitelist = 'Whitelist',
  Claims = 'Claims'
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
