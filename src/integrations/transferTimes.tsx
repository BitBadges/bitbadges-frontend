import { ClaimIntegrationPublicParamsType, ClaimIntegrationPrivateParamsType, UintRangeArray, BigIntify, NumberifyIfPossible } from 'bitbadgesjs-sdk';
import { useEffect } from 'react';
import { DateSelectWithSwitch } from '../components/inputs/DateRangeInput';
import { getTimeRangesString } from '../utils/dates';
import { ClaimIntegrationPlugin } from './integrations';

const TransferTimesCreateNode = ({
  publicParams,
  setParams,
  setDisabled
}: {
  publicParams: ClaimIntegrationPublicParamsType<'transferTimes'>;
  setParams: (
    publicParams: ClaimIntegrationPublicParamsType<'transferTimes'>,
    privateParams: ClaimIntegrationPrivateParamsType<'transferTimes'>
  ) => void;
  setDisabled: (disabled: string) => void;
}) => {
  useEffect(() => {
    setDisabled(UintRangeArray.From(publicParams.transferTimes).convert(BigIntify).length === 0 ? 'No times selected.' : '');
  }, [publicParams.transferTimes]);

  return (
    <div className="flex-center">
      <DateSelectWithSwitch
        timeRanges={UintRangeArray.From(publicParams.transferTimes).convert(BigIntify)}
        setTimeRanges={(val) => {
          setParams({ transferTimes: val.convert(NumberifyIfPossible) }, {});
        }}
      />
    </div>
  );
};

export const TransferTimesPluginDetails: ClaimIntegrationPlugin<'transferTimes'> = {
  id: 'transferTimes',
  metadata: {
    name: 'Time Window',
    description: 'Restrict when the claim is valid.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: true,
    scoped: true,
    onChainCompatible: false
  },
  createNode({ publicParams, setParams, setDisabled }) {
    return <TransferTimesCreateNode publicParams={publicParams} setParams={setParams} setDisabled={setDisabled} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'transferTimes'> }) => {
    return `Claim is only valid during the specified times: ${getTimeRangesString(UintRangeArray.From(publicParams.transferTimes).convert(BigIntify))}.`;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { transferTimes: UintRangeArray.FullRanges().convert(NumberifyIfPossible) };
  },
  getBlankPublicState() {
    return {};
  }
};
