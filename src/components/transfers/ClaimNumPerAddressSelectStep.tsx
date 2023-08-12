import { Checkbox, InputNumber, Typography } from "antd";
import { BigIntify, DistributionMethod, Numberify } from "bitbadgesjs-utils";

export function ClaimNumPerAddressSelectStep(numPerAddress: bigint, setNumPerAddress: (numRecipients: bigint) => void, distributionMethod: DistributionMethod, hasPassword: boolean) {



  return {
    title: `Per Address`,
    description: < div className='flex-center primary-text'>
      <div style={{ minWidth: 500, textAlign: 'center' }} >
        <br />
        <div className='flex-between' style={{ flexDirection: 'column' }} >
          <b>Max Claims Per Address</b>
          {numPerAddress > 0 &&
            <InputNumber
              min={1}
              value={Numberify(numPerAddress)}
              onChange={(value) => {
                setNumPerAddress(BigIntify(value));
              }}
              className='primary-text primary-blue-bg'
            />}
          <br />
          <Checkbox
            checked={numPerAddress === 0n}
            onChange={(e) => {
              setNumPerAddress(e.target.checked ? BigInt(0) : BigInt(1));
            }}
            className="primary-text primary-blue-bg"
          >
            <div className='primary-text primary-blue-bg' style={{ fontSize: 14 }}>
              No Limit
            </div>
          </Checkbox>
        </div>
        <br />
        <Typography.Text className='secondary-text' style={{ textAlign: 'center' }}>
          {distributionMethod === DistributionMethod.Codes && !hasPassword ? 'Each address can ' + (numPerAddress === 0n ? 'redeem an unlimited amount of codes (i.e. if the codes are valid and there are claimable badges left).' : `redeem a maximum of ${numPerAddress} code(s).`) : ''}
          {distributionMethod === DistributionMethod.Whitelist ? 'Each address on the whitelist can successfully claim ' + (numPerAddress === 0n ? 'an unlimited amount of times  (i.e. if there are claimable badges left).' : `a maximum of ${numPerAddress} time(s).`) : ''}
        </Typography.Text>
      </div>
    </div >,
    disabled: numPerAddress < 0
  }
}