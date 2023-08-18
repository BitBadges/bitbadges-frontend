import { Button, Divider, Input, Typography } from 'antd';
import { useState } from 'react';
import { addMetadataToIpfs, createAddressMappings } from '../../../bitbadges-api/api';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { CreateTxMsgCreateAddressMappingModal } from '../../tx-modals/CreateTxMsgCreateAddressMapping';
import { MSG_PREVIEW_ID, MsgUpdateCollectionProps } from '../TxTimeline';
import { SwitchForm } from './SwitchForm';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useRouter } from 'next/router';

const crypto = require('crypto');

export function SubmitMsgCreateAddressMapping({
  txState,
}: {
  txState: MsgUpdateCollectionProps
}) {

  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  const chain = useChainContext();
  const router = useRouter();

  const [onChainStorage, setOnChainStorage] = useState<boolean>(false);
  const [clicked, setClicked] = useState<boolean>(false);

  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];

  const addressMapping = txState.addressMapping;
  const setAddressMapping = txState.setAddressMapping;

  return <div className='full-width'
    style={{ marginTop: 20, }} >
    <SwitchForm
      options={[

        {
          title: 'Off-Chain',
          message: <div>{`We handle the storage for you! We will store your list info on our centralized servers and IPFS. This is completely free!`}
          </div>,
          isSelected: clicked && !onChainStorage,
        },
        {
          title: 'On-Chain',
          message: `The address list will be stored on-chain. This will cost a transaction fee to store it.`,
          isSelected: clicked && onChainStorage,
        },
      ]}
      onSwitchChange={(idx) => {
        setClicked(true);
        if (idx === 1) {
          setOnChainStorage(true);

          setAddressMapping({
            ...addressMapping,
            mappingId: '',
          });
        } else if (idx === 0) {
          setOnChainStorage(false);
          setAddressMapping({
            ...addressMapping,
            mappingId: chain.cosmosAddress + ':' + crypto.randomBytes(32).toString('hex'),
          });
        }
      }}
    />
    {onChainStorage && <>
      <br />
      <div style={{}} >
        <Typography.Text strong style={{ fontSize: 18 }} className='primary-text'>List ID</Typography.Text>
      </div>
      <Input
        defaultValue={addressMapping.mappingId}
        placeholder="Enter a unique identifier for your list."
        // onSearch={async (value) => {
        //   onSearch(value, true);
        // }}
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
    <br />
    <Button
      type="primary"
      loading={loading}
      disabled={loading || !clicked}
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

          await createAddressMappings({
            addressMappings: [{
              ...addressMapping,
              uri: metadataUrl,
            }],
          });

          router.push(`/addresses/${addressMapping.mappingId}`);

        }
        setLoading(false);
      }}
    >
      Create Address List!
    </Button>
    <CreateTxMsgCreateAddressMappingModal
      visible={visible}
      setVisible={setVisible}
      inheritedTxState={txState}
    />
  </div >
}
