import { Balance } from "bitbadgesjs-proto";
import { DistributionMethod, TransferWithIncrements } from "bitbadgesjs-utils";
import { CreateClaims } from "../form-items/CreateClaims";

export function CreateClaimsStepItem(
  transfers: TransferWithIncrements<bigint>[],
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void,
  distributionMethod: DistributionMethod,
  balancesToDistribute?: Balance<bigint>[],
) {
  return {
    title: `${distributionMethod === DistributionMethod.Codes ? 'Generate Codes' : distributionMethod === DistributionMethod.Whitelist ? 'Whitelist' : 'Claims'}`,
    description: '',
    node: <CreateClaims
      distributionMethod={distributionMethod}
      balancesToDistribute={balancesToDistribute}
      transfers={transfers}
      setTransfers={setTransfers}
    />
  }
}