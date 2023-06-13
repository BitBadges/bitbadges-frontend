import { InfoCircleOutlined } from "@ant-design/icons";
import { Input, InputNumber, Tooltip } from "antd";
import { DistributionMethod } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm";
import { CodeType } from "./TransferOrClaimSelect";

export function ClaimCodesSelectStep(distributionMethod: DistributionMethod, setNumRecipients: (numRecipients: bigint) => void, password?: string, setClaimPassword?: (password: string) => void) {
  const [numCodes, setNumCodes] = useState<number>(0);
  const [codeType, setCodeType] = useState(CodeType.None);

  if (distributionMethod === DistributionMethod.Codes && (!password || !setClaimPassword)) {
    throw new Error('Password and setClaimPassword must be defined for reusable codes');
  }

  useEffect(() => {
    setNumRecipients(BigInt(numCodes));
  }, [numCodes, setNumRecipients]);

  if (distributionMethod === DistributionMethod.FirstComeFirstServe || !password || !setClaimPassword) {
    return {
      title: `Max Claims (${numCodes})`,
      description: < div className='flex-center'>
        <div style={{ minWidth: 500 }} >
          <br />
          <div className='flex-between' style={{ flexDirection: 'column' }} >

            <b>Max Claims</b>
            <InputNumber
              min={1}
              value={numCodes}
              onChange={(value) => {
                setNumCodes(value);
              }}
              className='primary-text primary-blue-bg'
            />
          </div>
        </div>
      </div >,
      disabled: numCodes <= 0
    }
  } else {
    return {
      title: `Codes (${numCodes})`,
      description: <div className="flex-center">
        <div style={{ minWidth: 500 }} >
          <br />
          <div className='flex-between' style={{ flexDirection: 'column' }} >
            {distributionMethod === DistributionMethod.Codes && <div>
              <SwitchForm
                options={[{
                  title: 'Unique Codes',
                  message: 'Codes will be uniquely generated and one-time use only. You can distribute these codes how you would like. No limit per address.',
                  isSelected: codeType === CodeType.Unique,
                },
                {
                  title: 'Password',
                  message: `You enter a custom password that is to be used by all claimees (e.g. attendance code). Limited to one use per address.`,
                  isSelected: codeType === CodeType.Reusable,
                }]}
                onSwitchChange={(option, _title) => {
                  if (option === 0) {
                    setCodeType(CodeType.Unique);
                  } else {
                    setCodeType(CodeType.Reusable);
                  }
                  setClaimPassword('');
                }}

              />
            </div>}
            {codeType === CodeType.Reusable && <div style={{ textAlign: 'center' }}>
              <br />
              <b style={{ textAlign: 'center' }}>Password</b>
              <Input
                value={password}
                onChange={(e) => {
                  setClaimPassword(e.target.value);
                }}
                className='primary-text primary-blue-bg'
              />
            </div>}
            <br />
            {codeType !== CodeType.None && <div style={{ textAlign: 'center' }}>
              <b>Number of {codeType === CodeType.Unique ? 'Codes' : 'Uses'}</b>
              <br />
              <InputNumber
                min={0}
                max={100000}
                value={numCodes}
                onChange={(value) => {
                  setNumCodes(value);
                }}
                className='primary-text primary-blue-bg'
              />
            </div>}
            <div style={{ textAlign: 'center' }} className='secondary-text'>
              <br />
              <p>
                <InfoCircleOutlined /> Note that this is a centralized solution. <Tooltip color='black' title="For a better user experience, codes and passwords are stored in a centralized manner via the BitBadges servers. This makes it easier for you (the collection creator) by eliminating storage requirements. For a decentralized solution, you can store your own codes and interact directly with the blockchain (see documentation).">
                  Hover to learn more.
                </Tooltip>
              </p>
            </div>
          </div>
        </div>
      </div >,
      disabled: numCodes <= 0 || (codeType === CodeType.Reusable && password.length === 0),
    }
  }
}