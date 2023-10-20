import { Button, Divider, Input, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { addMetadataToIpfs, updateAddressMappings } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { CreateTxMsgCreateAddressMappingModal } from '../../tx-modals/CreateTxMsgCreateAddressMapping';

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

  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);


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
          value={addressMapping.mappingId}
          onChange={async (e) => {
            setAddressMapping({
              ...addressMapping,
              mappingId: e.target.value,
            });
          }}
          className='form-input'
          size='large'
        />
        <Divider />
      </>}
    </>}
    <br />
    <Button
      type="primary"
      loading={loading}
      disabled={loading || !clicked || !addressMapping.mappingId}
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
    </Button>
    <CreateTxMsgCreateAddressMappingModal
      visible={visible}
      setVisible={setVisible}
      inheritedTxState={txState}
    />
  </div >
}
