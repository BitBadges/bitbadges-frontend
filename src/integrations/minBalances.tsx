import { ClaimIntegrationPublicParamsType, ClaimIntegrationPrivateParamsType } from 'bitbadgesjs-sdk';
import { NumberInput } from '../components/inputs/NumberInput';
import { ClaimIntegrationPlugin } from './integrations';

const MinBalanceCreateNode = ({
  publicParams,
  privateParams,
  setParams
}: {
  publicParams: ClaimIntegrationPublicParamsType<'greaterThanXBADGEBalance'>;
  privateParams: ClaimIntegrationPrivateParamsType<'greaterThanXBADGEBalance'>;
  setParams: (
    publicParams: ClaimIntegrationPublicParamsType<'greaterThanXBADGEBalance'>,
    privateParams: ClaimIntegrationPrivateParamsType<'greaterThanXBADGEBalance'>
  ) => void;
}) => {
  const minBalance = publicParams.minBalance;

  const MinBalanceSelect = (
    <div style={{ textAlign: 'center' }}>
      <br />
      <b style={{ textAlign: 'center' }}>Minimum Balance</b>
      <NumberInput
        value={minBalance}
        setValue={(val) => {
          setParams({ minBalance: val }, privateParams);
        }}
        min={1}
      />
      {!minBalance && <div style={{ color: 'red' }}>Minimum balance cannot be empty.</div>}
    </div>
  );

  return MinBalanceSelect;
};

export const MinBalancesPluginDetails: ClaimIntegrationPlugin<'greaterThanXBADGEBalance'> = {
  id: 'greaterThanXBADGEBalance',
  metadata: {
    name: 'Min $BADGE',
    description: 'Users must have a minimum balance of $BADGE.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: true,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => '',
  createNode: MinBalanceCreateNode,
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'greaterThanXBADGEBalance'> }) => {
    return `Must have a balance greater than ${publicParams.minBalance} $BADGE.`;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { minBalance: 0 };
  },
  getBlankPublicState() {
    return {};
  }
};
