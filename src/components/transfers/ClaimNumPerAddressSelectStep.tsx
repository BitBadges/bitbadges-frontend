import { Checkbox, Col, InputNumber, Row, Typography } from "antd";
import { BigIntify, DistributionMethod, Numberify } from "bitbadgesjs-utils";
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm";

export function ClaimNumPerAddressSelectStep(
  numPerInitiatedByAddress: bigint,
  setNumPerInitiatedByAddress: (numRecipients: bigint) => void,
  numPerToAddress: bigint,
  setNumPerToAddress: (numRecipients: bigint) => void,
  requireToEqualsInitiatedBy: boolean,
  setRequireToEqualsInitiatedBy: (requireToEqualsInitiatedBy: boolean) => void,
  // requireToDoesNotEqualInitiatedBy: boolean,
  // setRequireToDoesNotEqualInitiatedBy: (requireToDoesNotEqualInitiatedBy: boolean) => void,
  distributionMethod: DistributionMethod,
  hasPassword: boolean
) {



  return {
    title: `Restrictions`,
    description: <>
      <br />
      <div className="flex-center">
        <Typography.Text strong className="primary-text" style={{ textAlign: 'center', fontSize: 18 }}>
          Additional Restrictions
        </Typography.Text>
      </div>
      <Row className='flex-between primary-text' style={{ minWidth: 320, textAlign: 'center', alignItems: 'normal' }} >

        <Col md={12} xs={24} style={{ textAlign: 'center' }}>
          <Typography.Text strong className="primary-text" style={{ textAlign: 'center', fontSize: 18 }}>
            Initiated By Address Restrictions
          </Typography.Text>
          <br />
          <br />
          <div className='flex-between' style={{ flexDirection: 'column' }} >
            <b>Max Claims Per Initiated By Address</b>
            {numPerInitiatedByAddress > 0 &&
              <InputNumber
                min={1}
                value={Numberify(numPerInitiatedByAddress)}
                onChange={(value) => {
                  setNumPerInitiatedByAddress(value ? BigIntify(value) : 0n);
                }}
                className='primary-text inherit-bg'
              />}
            <br />
            <Checkbox
              checked={numPerInitiatedByAddress === 0n}
              onChange={(e) => {
                setNumPerInitiatedByAddress(e.target.checked ? BigInt(0) : BigInt(1));
              }}
              className="primary-text inherit-bg"
            >
              <div className='primary-text inherit-bg' style={{ fontSize: 14 }}>
                No Limit
              </div>
            </Checkbox>
          </div>
          <Typography.Text className='secondary-text' style={{ textAlign: 'center' }}>
            {distributionMethod === DistributionMethod.Codes && !hasPassword ? 'Each unique address can initiate' + (numPerInitiatedByAddress === 0n ? ' an unlimited amount of claims (i.e. if the codes are valid and there are claimable badges left).' : ` a maximum of ${numPerInitiatedByAddress} claim(s).`) : ''}
            {distributionMethod === DistributionMethod.Whitelist ? 'Each unique address on the whitelist can successfully claim ' + (numPerInitiatedByAddress === 0n ? 'an unlimited amount of times  (i.e. if there are claimable badges left).' : `a maximum of ${numPerInitiatedByAddress} time(s).`) : ''}
          </Typography.Text>
        </Col>
        <Col md={0} xs={24} style={{ height: 30 }} />
        <Col md={12} xs={24} style={{ textAlign: 'center' }}>
          <Typography.Text strong className="primary-text" style={{ textAlign: 'center', fontSize: 18 }}>
            Recipient (To Address) Restrictions
          </Typography.Text>
          <br />
          <br />
          <SwitchForm
            options={[{
              title: 'No Gifting',
              message: 'The recipient of the claim must be the same as the address that initiated the claim.',
              isSelected: requireToEqualsInitiatedBy,
            },
            {
              title: 'Allow Gifting',
              message: 'The recipient of the claim can be different from the address that initiated the claim.',
              isSelected: !requireToEqualsInitiatedBy,
            }]}
            onSwitchChange={(option, _title) => {
              if (option === 0) {
                setRequireToEqualsInitiatedBy(true);
              } else {
                setRequireToEqualsInitiatedBy(false);
              }
            }}
          />
          {/* <Checkbox
            checked={requireToEqualsInitiatedBy}
            onChange={(e) => {
              setRequireToEqualsInitiatedBy(e.target.checked);
              if (!e.target.checked) {
                setNumPerToAddress(1n);
              }
            }
            }
            className="primary-text inherit-bg"
          >
            <div className='primary-text inherit-bg' style={{ fontSize: 14 }}>
              Require To Address Equals Initiated By Address?
            </div>
          </Checkbox> */}
          <br />
          <br />

          {!requireToEqualsInitiatedBy && <>
            <br />
            <div className='flex-between' style={{ flexDirection: 'column' }} >
              <b>Max Received Claims</b>
              {numPerToAddress > 0 &&
                <InputNumber
                  min={1}
                  value={Numberify(numPerToAddress)}
                  onChange={(value) => {
                    setNumPerToAddress(value ? BigIntify(value) : 0n);
                  }}
                  className='primary-text inherit-bg'
                />}
              <br />
              <Checkbox
                checked={numPerToAddress === 0n}
                onChange={(e) => {
                  setNumPerToAddress(e.target.checked ? BigInt(0) : BigInt(1));
                }}
                className="primary-text inherit-bg"
              >
                <div className='primary-text inherit-bg' style={{ fontSize: 14 }}>
                  No Limit
                </div>
              </Checkbox>
            </div>
            <br />
            <Typography.Text className='secondary-text' style={{ textAlign: 'center' }}>
              {distributionMethod === DistributionMethod.Codes && !hasPassword ? 'Each unique address can be the recipient of' + (numPerToAddress === 0n ? ' an unlimited amount of claims.' : ` a maximum of ${numPerToAddress} claim(s).`) : ''}
              {distributionMethod === DistributionMethod.Whitelist ? 'Each unique address on the whitelist can successfully claim ' + (numPerToAddress === 0n ? 'an unlimited amount of times  (i.e. if there are claimable badges left).' : `a maximum of ${numPerToAddress} time(s).`) : ''}
            </Typography.Text>
          </>}
        </Col>
      </Row>
      <br />
    </ >,
    disabled: numPerInitiatedByAddress < 0
  }
}