import { InfoCircleOutlined } from '@ant-design/icons';
import { ClaimIntegrationPublicStateType, ClaimIntegrationPublicParamsType } from 'bitbadgesjs-sdk';
import { NumberInput } from '../components/inputs/NumberInput';
import { ClaimIntegrationPlugin } from './integrations';

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
  createNode({ publicParams, setParams }) {
    const numRecipients = publicParams.maxUses;
    return (
      <>
        <NumberInput
          title="Number of Claims"
          value={numRecipients}
          setValue={(val) => {
            setParams({ maxUses: val }, {});
          }}
          min={1}
        />
        <br />
        <div className="secondary-text flex-center">
          <InfoCircleOutlined className="mr-1" /> One claim per address. {numRecipients ? ` ${numRecipients} claims allowed total.` : ''}
        </div>
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
    return `One claim per address.${publicParams.maxUses && !unknownPublicState ? ` ${publicState.numUses} / ${publicParams.maxUses} claims used total.` : ''} `;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { maxUses: 1 };
  },
  getBlankPublicState() {
    return { numUses: 0, claimedUsers: {} };
  }
};
