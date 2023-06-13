import { Balance } from "bitbadgesjs-proto";
import { ClaimInfoWithDetails, DistributionMethod, TransferWithIncrements } from "bitbadgesjs-utils";
import { CreateClaims } from "../form-items/CreateClaims";

export function CreateClaimsStepItem(
  transfers: TransferWithIncrements<bigint>[],
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void,
  claims: (ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[],
  setClaims: (claims: (ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[]) => void,
  distributionMethod: DistributionMethod,
  balancesToDistribute?: Balance<bigint>[],
) {
  return {
    title: `${distributionMethod === DistributionMethod.Codes ? 'Generate Codes' : distributionMethod === DistributionMethod.Whitelist ? 'Whitelist' : 'Claims'}`,
    description: '',
    node: <CreateClaims
      distributionMethod={distributionMethod}
      balancesToDistribute={balancesToDistribute}
      claims={claims}
      setClaims={setClaims}
      transfers={transfers}
      setTransfers={setTransfers}
    />,
    disabled: claims.length == 0
  }
}