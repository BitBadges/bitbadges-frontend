import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { ClaimIntegrationPublicParamsType, ClaimIntegrationPublicStateType } from 'bitbadgesjs-sdk';
import { useEffect } from 'react';
import { ErrDisplay } from '../components/common/ErrDisplay';
import { NumberInput } from '../components/inputs/NumberInput';
import { RadioGroup } from '../components/inputs/Selects';
import { OffChainClaim } from '../components/tx-timelines/step-items/OffChainBalancesStepItem';
import { ClaimIntegrationPlugin } from './integrations';

const NumUsesCreateNode = ({
  claim,
  publicParams,
  setParams,
  type,
  setDisabled,
  isUpdate
}: {
  claim: Readonly<OffChainClaim<bigint>>;
  publicParams: ClaimIntegrationPublicParamsType<'numUses'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'numUses'>, privateParams: {}) => void;
  type: string;
  isUpdate: boolean;
  setDisabled: (err: string) => void;
}) => {
  const numRecipients = publicParams.maxUses;
  const numRecipientsPerAddress = publicParams.maxUsesPerAddress;
  const toShowAssignMethodSelector = type !== 'list';
  const assignMethod = publicParams.assignMethod;

  useEffect(() => {
    if (publicParams.assignMethod === 'codeIdx' && !claim.plugins.find((p) => p.id === 'codes')) {
      setDisabled('For assigning claim numbers by code, you must also have the "Codes" plugin enabled.');
    } else {
      setDisabled('');
    }
  }, [publicParams, claim.plugins]);
  console.log(publicParams);
  console.log(assignMethod);

  return (
    <>
      <div className="flex-center flex-wrap mt-4" style={{ alignItems: 'normal' }}>
        <div className="mx-5">
          <NumberInput
            title="Total"
            value={numRecipients}
            setValue={(val) => {
              setParams({ maxUses: val, maxUsesPerAddress: numRecipientsPerAddress, assignMethod }, {});
            }}
            min={1}
          />
        </div>
        <div className="mx-5">
          <div className="text-center">
            <b>Per Address</b>
          </div>
          {!!numRecipientsPerAddress && (
            <>
              <NumberInput
                title=""
                value={numRecipientsPerAddress}
                setValue={(val) => {
                  if (!val) return;

                  setParams({ maxUses: numRecipients, maxUsesPerAddress: val, assignMethod }, {});
                }}
                min={1}
              />
            </>
          )}
        </div>
      </div>
      {toShowAssignMethodSelector && (
        <div className="flex-center flex-wrap mt-4" style={{ alignItems: 'normal' }}>
          <div className="mx-5">
            <div className="text-center">
              <b>Claim # Assign Method</b>
            </div>
            <div className="flex-center flex-column">
              {!isUpdate && (
                <RadioGroup
                  value={publicParams.assignMethod}
                  onChange={(val) => {
                    setParams({ maxUses: numRecipients, maxUsesPerAddress: numRecipientsPerAddress, assignMethod: val }, {});
                  }}
                  options={[
                    { value: 'firstComeFirstServe', label: 'Increasing' },
                    { value: 'codeIdx', label: 'Code #' }
                  ]}
                  disabled={isUpdate}
                />
              )}
              {/* <Switch
                checked={publicParams.assignMethod === 'firstComeFirstServe'}
                checkedChildren="First Come First Serve"
                unCheckedChildren="Codes"
                onChange={(checked) => {
                  setParams(
                    { maxUses: numRecipients, maxUsesPerAddress: numRecipientsPerAddress, assignMethod: checked ? 'firstComeFirstServe' : 'codeIdx' },
                    {}
                  );
                }}
                disabled={isUpdate}
              /> */}
              <div className="secondary-text text-center">
                {publicParams.assignMethod === 'firstComeFirstServe'
                  ? 'First user to claim will be assigned claim #1, second user claim #2, etc.'
                  : 'Code #1 will correspond to claim #1, code #2 to claim #2, etc.'}
                {type === 'balances' &&
                  ' Claim numbers may be used to calculate the received badges and amounts, depending on the selected parameters.'}
              </div>
            </div>
          </div>
        </div>
      )}

      <br />
      <div className="secondary-text text-center">
        <InfoCircleOutlined className="mr-1" />
        {numRecipients ? ` ${numRecipients} claims allowed total.` : ''} {numRecipientsPerAddress ? numRecipientsPerAddress : 'No limit on'} claim(s)
        per address.{' '}
        {!numRecipientsPerAddress && (
          <>
            <WarningOutlined style={{ color: 'orange' }} className="mr-1" /> Please make sure this is intended, and the other criteria properly gates
            this claim.
          </>
        )}
      </div>
      <br />
      {!!numRecipientsPerAddress && numRecipientsPerAddress > numRecipients && (
        <div className="text-center">
          <ErrDisplay warning err="The number of claims per address is greater than the total number of claims allowed." />
        </div>
      )}
    </>
  );
};

export const NumUsesPluginDetails: ClaimIntegrationPlugin<'numUses'> = {
  id: 'numUses',
  metadata: {
    name: 'Number of Uses',
    description: 'This plugin restricts the number of times a user can claim.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: ({ publicState }) => {
    const usedClaimNumbers = [];
    for (const [, val] of Object.entries(publicState.claimedUsers ?? {})) {
      usedClaimNumbers.push(...val.map((x) => x + 1));
    }
    usedClaimNumbers.sort((a, b) => a - b);
    const stateStr = ` ${usedClaimNumbers.length} claim(s) have been processed. The currently used claim numbers are: ${usedClaimNumbers.join(', ')}.`;

    return 'The state tracks the number of claims that have been used overall and by for each user.' + stateStr;
  },
  createNode({ claim, publicParams, setParams, type, setDisabled, isUpdate }) {
    return (
      <NumUsesCreateNode claim={claim} publicParams={publicParams} setParams={setParams} type={type} setDisabled={setDisabled} isUpdate={isUpdate} />
    );
  },
  detailsString: ({
    publicParams,
    publicState,
    unknownPublicState
  }: {
    publicState: ClaimIntegrationPublicStateType<'numUses'>;
    publicParams: ClaimIntegrationPublicParamsType<'numUses'>;
    unknownPublicState?: boolean;
  }) => {
    return `${
      publicParams.maxUsesPerAddress ? publicParams.maxUsesPerAddress : 'No limit on '
    } claim(s) per address.${publicParams.maxUses && !unknownPublicState ? ` ${publicState.numUses} / ${publicParams.maxUses} claims used total.` : ''} 
    ${publicParams.assignMethod === 'firstComeFirstServe' ? 'Claim numbers increment with each claim.' : 'Claim numbers are assigned by code number.'}`;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { maxUses: 1, maxUsesPerAddress: 1, assignMethod: 'firstComeFirstServe' };
  },
  getBlankPublicState() {
    return { numUses: 0, claimedUsers: {} };
  }
};
