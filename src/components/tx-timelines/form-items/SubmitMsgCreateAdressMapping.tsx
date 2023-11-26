import { Divider, Input, Tooltip, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { addMetadataToIpfs, updateAddressMappings } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { CreateTxMsgCreateAddressMappingModal } from '../../tx-modals/CreateTxMsgCreateAddressMapping';

import { InfoCircleOutlined } from '@ant-design/icons';
import { deepCopy } from 'bitbadgesjs-proto';
import { getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { addMappingId } from '../../address/AddressMappingSelect';
import { SwitchForm } from './SwitchForm';

export function SubmitMsgCreateAddressMapping() {
  const chain = useChainContext();
  const txState = useTxTimelineContext();
  const addressMapping = txState.addressMapping;
  const setAddressMapping = txState.setAddressMapping;
  const isUpdateAddressMapping = txState.isUpdateAddressMapping;

  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  const router = useRouter();

  const [onChainStorage, setOnChainStorage] = useState<boolean>(false);
  const [clicked, setClicked] = useState<boolean>(!!isUpdateAddressMapping);
  const [mappingId, setMappingId] = useState<string>('');


  const collection = useCollection(NEW_COLLECTION_ID);


  return <div className='full-width'
    style={{ marginTop: 20, }} >
    {!isUpdateAddressMapping && <>
      <SwitchForm
        options={[

          {
            title: 'Off-Chain',
            message: <div>{`We handle the storage for you! We will store your list info on our centralized servers and IPFS. This is completely free! The list will be updatable and deletable by you.`}
            </div>,
            isSelected: clicked && !onChainStorage,
          },
          {
            title: 'On-Chain',
            message: `The address list will be stored on-chain. This will cost a transaction fee to store it. The list will be permanently frozen, meaning it can never be updated or deleted.`,
            isSelected: clicked && onChainStorage,
          },
        ]}
        onSwitchChange={(idx) => {
          setClicked(true);
          if (idx === 1) {
            setOnChainStorage(true);

          } else if (idx === 0) {
            setOnChainStorage(false);
          }
        }}
      />
      {<>
        <br />
        <div style={{}} >
          <Typography.Text strong style={{ fontSize: 18 }} className='primary-text'>List ID</Typography.Text>
        </div>
        <Input
          defaultValue={addressMapping.mappingId}
          placeholder="Enter a unique identifier for your list."
          value={mappingId}
          onChange={async (e) => {
            setMappingId(e.target.value);
            setAddressMapping({
              ...addressMapping,
              mappingId: e.target.value,
            });
          }}
          className='form-input'
          size='large'
        />
        {clicked && onChainStorage &&
          <div className='secondary-text' style={{ fontSize: 14, marginTop: 4 }}>
            <InfoCircleOutlined /> This combination of addresses is already stored on-chain without any metadata at the mapping ID:{' '}
            <Tooltip title={addMappingId(deepCopy(addressMapping)).mappingId} style={{}}>
              <span style={{ marginLeft: 2 }}> {getAbbreviatedAddress(addMappingId(deepCopy(addressMapping)).mappingId)}</span>
            </Tooltip>
          </div>}
        <Divider />
      </>}
    </>}
    <br />
    <button
      className='landing-button'
      disabled={loading || !clicked || !addressMapping.mappingId || !mappingId}
      style={{ width: '100%' }}
      onClick={async () => {
        if (!collection) return;

        setLoading(true)
        if (onChainStorage) {
          setVisible(true)
        } else {
          const metadataRes = await addMetadataToIpfs({
            collectionMetadata: collection.cachedCollectionMetadata,
          });

          const metadataUrl = metadataRes.collectionMetadataResult?.cid ? 'ipfs://' + metadataRes.collectionMetadataResult?.cid : '';
          const mappingId = onChainStorage ? addressMapping.mappingId : chain.cosmosAddress + "_" + addressMapping.mappingId;
          await updateAddressMappings({
            addressMappings: [{
              ...addressMapping,
              mappingId: mappingId,
              uri: metadataUrl,
            }],
          });
          router.push(`/addresses/${mappingId}`);

        }
        setLoading(false);
      }}
    >
      Submit
    </button>
    <CreateTxMsgCreateAddressMappingModal
      visible={visible}
      setVisible={setVisible}
      inheritedTxState={txState}
    />
  </div >
}
