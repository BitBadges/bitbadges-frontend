import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { ClaimIntegrationPublicStateType, ClaimIntegrationPublicParamsType } from 'bitbadgesjs-sdk';
import { NumberInput } from '../components/inputs/NumberInput';
import { ClaimIntegrationPlugin } from './integrations';
import { Switch } from 'antd';
import { ErrDisplay } from '../components/common/ErrDisplay';

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
  stateString: () => 'The state tracks the number of claims that have been used overall and by for each user.',
  createNode({ publicParams, setParams }) {
    const numRecipients = publicParams.maxUses;
    const numRecipientsPerAddress = publicParams.maxUsesPerAddress;

    return (
      <>
        <div className="flex-center flex-wrap" style={{ alignItems: 'normal' }}>
          <div className="mx-5">
            <NumberInput
              title="Total Number of Claims"
              value={numRecipients}
              setValue={(val) => {
                setParams({ maxUses: val, maxUsesPerAddress: numRecipientsPerAddress }, {});
              }}
              min={1}
            />
          </div>
          <div className="mx-5">
            <div className="text-center">
              <b>Number of Claims per Address</b>
            </div>
            <div className="my-2 secondary-text flex-center">
              <Switch
                checked={!!numRecipientsPerAddress}
                checkedChildren="Limited"
                unCheckedChildren="No Limit"
                onChange={(checked) => {
                  setParams({ maxUses: numRecipients, maxUsesPerAddress: checked ? 1 : 0 }, {});
                }}
              />
            </div>
            {!!numRecipientsPerAddress && (
              <>
                <NumberInput
                  title=""
                  value={numRecipientsPerAddress}
                  setValue={(val) => {
                    if (!val) return;

                    setParams({ maxUses: numRecipients, maxUsesPerAddress: val }, {});
                  }}
                  min={1}
                />
              </>
            )}
          </div>
        </div>

        <br />
        <div className="secondary-text flex-center">
          <InfoCircleOutlined className="mr-1" />
          {numRecipients ? ` ${numRecipients} claims allowed total.` : ''} {numRecipientsPerAddress ? numRecipientsPerAddress : 'No limit on'}{' '}
          claim(s) per address.{' '}
          {!numRecipientsPerAddress && (
            <div className="secondary-text flex-center">
              <WarningOutlined style={{ color: 'orange' }} className="mr-1" /> Please make sure this is intended, and the other criteria properly
              gates this claim.
            </div>
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
    } claim(s) per address.${publicParams.maxUses && !unknownPublicState ? ` ${publicState.numUses} / ${publicParams.maxUses} claims used total.` : ''} `;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { maxUses: 1, maxUsesPerAddress: 1 };
  },
  getBlankPublicState() {
    return { numUses: 0, claimedUsers: {} };
  }
};
