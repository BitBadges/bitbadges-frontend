import { ClaimIntegrationPublicParamsType, ClaimIntegrationPrivateParamsType, AddressList } from 'bitbadgesjs-sdk';
import { useEffect } from 'react';
import { AddressListSelect } from '../components/address/AddressListsSelect';
import { ClaimIntegrationPlugin } from './integrations';

const WhitelistCreateNode = ({
  publicParams,
  setParams,
  setDisabled
}: {
  publicParams: ClaimIntegrationPublicParamsType<'whitelist'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'whitelist'>, privateParams: ClaimIntegrationPrivateParamsType<'whitelist'>) => void;
  setDisabled: (disabled: string) => void;
}) => {
  const list = new AddressList(publicParams.list ?? new AddressList({ addresses: [], whitelist: true, customData: '', listId: '', uri: '' }));

  useEffect(() => {
    const list = new AddressList(publicParams.list ?? new AddressList({ addresses: [], whitelist: true, customData: '', listId: '', uri: '' }));
    setDisabled(list.isEmpty() ? 'No addresses in whitelist.' : '');
  }, [publicParams.list]);

  return (
    <div className="flex-center">
      <AddressListSelect
        addressList={list}
        setAddressList={(val) => {
          setParams({ list: val }, {});
        }}
      />
    </div>
  );
};

export const WhitelistPluginDetails: ClaimIntegrationPlugin<'whitelist'> = {
  id: 'whitelist',
  metadata: {
    name: 'Whitelist',
    description: 'Only allow claims from specific addresses.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: false
  },
  createNode({ publicParams, setParams, setDisabled }) {
    return <WhitelistCreateNode publicParams={publicParams} setParams={setParams} setDisabled={setDisabled} />;
  },
  detailsString: () => {
    return `Only allow claims from addresses in the whitelist.`;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return {
      list: new AddressList({
        customData: '',
        listId: '',
        addresses: [],
        whitelist: true,
        uri: ''
      })
    };
  },
  getBlankPublicState() {
    return {};
  }
};
