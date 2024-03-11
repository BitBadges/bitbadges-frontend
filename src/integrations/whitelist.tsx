import { AddressList, ClaimIntegrationPrivateParamsType, ClaimIntegrationPublicParamsType } from 'bitbadgesjs-sdk';
import { useEffect, useMemo, useState } from 'react';
import { AddressListSelect } from '../components/address/AddressListsSelect';
import { RadioGroup } from '../components/inputs/Selects';
import { ClaimIntegrationPlugin } from './integrations';

export const PublicPrivateSelect = ({
  privateVal,
  setPrivateVal,
  onChange
}: {
  privateVal: boolean;
  setPrivateVal: (val: boolean) => void;
  onChange: (val: boolean) => void;
}) => {
  return (
    <>
      <RadioGroup
        options={[
          { label: 'Private', value: true },
          { label: 'Public', value: false }
        ]}
        value={privateVal}
        onChange={(val) => {
          setPrivateVal(val);
          onChange(val);
        }}
      />
      <div className="secondary-text mt-1">Should these details be displayed publicly with the claim?</div>
      <br />
    </>
  );
};

const WhitelistCreateNode = ({
  publicParams,
  privateParams,
  setParams,
  setDisabled
}: {
  publicParams: ClaimIntegrationPublicParamsType<'whitelist'>;
  privateParams: ClaimIntegrationPrivateParamsType<'whitelist'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'whitelist'>, privateParams: ClaimIntegrationPrivateParamsType<'whitelist'>) => void;
  setDisabled: (disabled: string) => void;
}) => {
  const isPrivate = privateParams?.list || privateParams?.listId;
  const [privateList, setPrivateList] = useState<boolean>(!!isPrivate);

  const list = useMemo(() => {
    if (privateList) {
      return new AddressList(privateParams.list ?? new AddressList({ addresses: [], whitelist: true, customData: '', listId: '', uri: '' }));
    }

    return new AddressList(publicParams.list ?? new AddressList({ addresses: [], whitelist: true, customData: '', listId: '', uri: '' }));
  }, [publicParams.list, privateList, privateParams.list]);

  useEffect(() => {
    setDisabled(list.isEmpty() ? 'No addresses in whitelist.' : '');
  }, [list]);

  const setList = (val: AddressList, privateList?: boolean) => {
    if (privateList) {
      setParams({}, { list: val });
    } else {
      setParams({ list: val }, {});
    }
  };

  return (
    <div className="flex-center flex-column">
      <PublicPrivateSelect
        privateVal={privateList}
        setPrivateVal={setPrivateList}
        onChange={(val) => {
          setList(list, val);
        }}
      />
      <AddressListSelect
        addressList={list}
        setAddressList={(val) => {
          setList(val, privateList);
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
    onChainCompatible: true
  },
  stateString: () => 'The state tracks the addresses that have claimed.',
  createNode({ publicParams, privateParams, setParams, setDisabled }) {
    return <WhitelistCreateNode publicParams={publicParams} privateParams={privateParams} setParams={setParams} setDisabled={setDisabled} />;
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
