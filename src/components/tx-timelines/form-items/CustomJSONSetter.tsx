
import { WarningOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row, Typography } from 'antd';
import { getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { MSG_PREVIEW_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';


export const validateUintRangeArr = (val: any) => {
  if (!val) throw new Error('UintRanges must be defined');
  if (!Array.isArray(val)) throw new Error('Must be an array');
  for (const el of val) {
    if (!el.start || !el.end) throw new Error('Each element must define start and end');
    if (BigInt(el.start) > BigInt(el.end)) throw new Error('start must be less than end');
  }

  return true;
}

export function JSONSetter({
  jsonPropertyPath,
  setErr,
  isPermissionUpdate,
  customValue,
  customSetValueFunction
}: {
  jsonPropertyPath: string,
  setErr: (err: string) => void,
  isPermissionUpdate?: boolean,
  customValue?: any,
  customSetValueFunction?: (val: any) => void
}) {

  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const [inputJson, setInputJson] = useState<string>('');

  if (!collection) return <></>;

  const currValue = customValue ? customValue : !isPermissionUpdate ? collection?.[jsonPropertyPath as keyof typeof collection] :
    collection.collectionPermissions?.[jsonPropertyPath as keyof typeof collection.collectionPermissions];

  const setCurrentValue =
    customSetValueFunction ? (val: any) => {
      try {
        customSetValueFunction(val);
      } catch (e: any) {
        setErr(e.message);
      }
    } : !isPermissionUpdate ? (val: any) => {
      const isValid = preClean(val);
      if (!isValid) return;

      collections.updateCollection({
        ...collection,
        [`${jsonPropertyPath}`]: val
      });
    } : (val: any) => {
      const isValid = preClean(val);
      if (!isValid) return;

      collections.updateCollection({
        ...collection,
        collectionPermissions: {
          ...collection.collectionPermissions,
          [`${jsonPropertyPath}`]: val
        }
      });
    }





  const preClean = (val: any) => {

    try {
      if (!Array.isArray(val)) throw new Error('Must be an array');
      if (isPermissionUpdate) {
        //Must be an array and each element must have defaultValues and combinations

        for (const el of val) {
          if (!el.defaultValues || !el.combinations) throw new Error('Each element must define defaultValues and combinations');
          if (!Array.isArray(el.combinations)) throw new Error('combinations must be an array');
          for (const combo of el.combinations) {
            const options = ['fromMappingOptions', 'toMappingOptions', 'initiatedByMappingOptions', 'transferTimesOptions', 'badgeIdsOptions', 'ownershipTimesOptions', 'permittedTimesOptions', 'forbiddenTimesOptions'];
            for (const option of options) {
              if (combo[`option`] && typeof combo[`option`] !== 'object') throw new Error(`${option} must be an object`);
              if (combo[`option`] && combo[`${option}`].invertDefault && typeof combo[`${option}`].invertDefault !== 'boolean') throw new Error('invertDefault must be a boolean');
              if (combo[`option`] && combo[`${option}`].allValues && typeof combo[`${option}`].allValues !== 'boolean') throw new Error('allValues must be a boolean');
              if (combo[`option`] && combo[`${option}`].noValues && typeof combo[`${option}`].noValues !== 'boolean') throw new Error('noValues must be a boolean');
            }
          }

          //TODO: Make this dynamic and ensure that the options are valid based on permission type
          if (el.fromMappingId && typeof el.fromMappingId !== 'string') throw new Error('fromMappingId must be a string');
          if (el.initiatedByMappingId && typeof el.initiatedByMappingId !== 'string') throw new Error('initiatedByMappingId must be a string');
          if (el.toMappingId && typeof el.toMappingId !== 'string') throw new Error('toMappingId must be a string');
          if (el.badgeIds && !validateUintRangeArr(el.badgeIds)) throw new Error('badgeIds must be an array of UintRange');
          if (el.ownershipTimes && !validateUintRangeArr(el.ownershipTimes)) throw new Error('ownershipTimes must be an array of UintRange');
          if (el.transferTimes && !validateUintRangeArr(el.transferTimes)) throw new Error('transferTimes must be an array of UintRange');
          if (el.permittedTimes && !validateUintRangeArr(el.permittedTimes)) throw new Error('permittedTimes must be an array of UintRange');
          if (el.forbiddenTimes && !validateUintRangeArr(el.forbiddenTimes)) throw new Error('forbiddenTimes must be an array of UintRange');
        }
      } else {
        //is a timeline update
        //Must be an array and each element must have timelineTimes
        for (const el of val) {
          if (!el.timelineTimes) throw new Error('Each element must define timelineTimes');
          if (el.timelineTimes && !validateUintRangeArr(el.timelineTimes)) throw new Error('Each element must define timelineTimes');

          //TODO: Handle defining each timeline actual value
          if (Object.keys(val[0]).length == 1) throw new Error('All timelines must define a value in addition to timelineTimes');

          if (el.manager && typeof el.manager !== 'string') throw new Error('manager must be a string');
          if (el.manager && !el.manager.startsWith('cosmos')) throw new Error('manager must be a cosmos address');

          if (el.collectionMetadata && typeof el.collectionMetadata !== 'object') throw new Error('collectionMetadata must be an object');
          if (el.collectionMetadata && typeof el.collectionMetadata.uri !== 'string') throw new Error('collectionMetadata.uri must be a string');
          if (el.collectionMetadata && typeof el.collectionMetadata.customData !== 'string') throw new Error('collectionMetadata.customData must be a string');

          if (el.badgeMetadata && !Array.isArray(el.badgeMetadata)) throw new Error('badgeMetadata must be an array');
          if (el.badgeMetadata && el.badgeMetadata.length > 0) {
            for (const badge of el.badgeMetadata) {
              if (typeof badge !== 'object') throw new Error('badgeMetadata must be an array of objects');
              if (typeof badge.badgeIds !== 'object') throw new Error('badgeMetadata.badgeIds must be an object');
              if (!validateUintRangeArr(badge.badgeIds)) throw new Error('badgeMetadata.badgeIds must be an array of UintRange');
              if (typeof badge.uri !== 'string') throw new Error('badgeMetadata.uri must be a string');
              if (typeof badge.customData !== 'string') throw new Error('badgeMetadata.customData must be a string');
            }
          }

          if (el.offChainBalancesMetadata && typeof el.offChainBalancesMetadata !== 'object') throw new Error('offChainBalancesMetadata must be an object');
          if (el.offChainBalancesMetadata && typeof el.offChainBalancesMetadata.uri !== 'string') throw new Error('offChainBalancesMetadata.uri must be a string');
          if (el.offChainBalancesMetadata && typeof el.offChainBalancesMetadata.customData !== 'string') throw new Error('offChainBalancesMetadata.customData must be a string');

          if (el.customData && typeof el.customData !== 'string') throw new Error('customData must be a string');

          if (el.standards && !Array.isArray(el.standards)) throw new Error('standards must be an array');
          if (el.standards && el.standards.length > 0) {
            for (const standard of el.standards) {
              if (typeof standard !== 'string') throw new Error('standards must be an array of strings');
            }
          }

          if (el.isArchived && typeof el.isArchived !== 'boolean') throw new Error('isArchived must be a boolean');

          if (el.contractAddress && typeof el.contractAddress !== 'string') throw new Error('contractAddress must be a string');

          if (el.collectionApprovals && !Array.isArray(el.collectionApprovals)) throw new Error('collectionApprovals must be an array');

          for (const approval of el.collectionApprovals) {
            if (!approval.badgeIds || !validateUintRangeArr(approval.badgeIds)) throw new Error('approval.badgeIds must be an array of UintRange');
            if (!approval.ownershipTimes || !validateUintRangeArr(approval.ownershipTimes)) throw new Error('approval.ownershipTimes must be an array of UintRange');
            if (!approval.transferTimes || !validateUintRangeArr(approval.transferTimes)) throw new Error('approval.transferTimes must be an array of UintRange');
            if (!approval.fromMappingId || typeof approval.fromMappingId !== 'string') throw new Error('approval.fromMappingId must be a string');
            if (!approval.initiatedByMappingId || typeof approval.initiatedByMappingId !== 'string') throw new Error('approval.initiatedByMappingId must be a string');

            if (!approval.toMappingId || typeof approval.toMappingId !== 'string') throw new Error('approval.toMappingId must be a string');

            if (!approval.allowedCombinations || !Array.isArray(approval.allowedCombinations)) throw new Error('approval.allowedCombinations must be an array');
            for (const combo of approval.allowedCombinations) {
              //TODO: Add the rest of  the options 
              if (combo.isApproved === undefined || typeof combo.isApproved !== 'boolean') throw new Error('combo.isApproved must be a boolean');


            }

            if (!approval.approvalCriteria || !Array.isArray(approval.approvalCriteria)) throw new Error('approval.approvalCriteria must be an array');
            //TODO: Add approval details validation
            const fromMapping = getReservedAddressMapping(approval.fromMappingId);
            const initiatedByMapping = getReservedAddressMapping(approval.initiatedByMappingId);
            const toMapping = getReservedAddressMapping(approval.toMappingId);

            if (!approval.fromMapping && !fromMapping) {
              throw new Error('We currently do not support custom mapping IDs. Please enter it manually via fromMapping.');
            }

            if (!approval.initiatedByMapping && !initiatedByMapping) {
              throw new Error('We currently do not support custom mapping IDs. Please enter it manually via initiatedByMapping.');
            }

            if (!approval.toMapping && !toMapping) {
              throw new Error('We currently do not support custom mapping IDs. Please enter it manually via toMapping.');
            }

            approval.fromMapping = approval.fromMapping || fromMapping;
            approval.initiatedByMapping = approval.initiatedByMapping || initiatedByMapping;
            approval.toMapping = approval.toMapping || toMapping;
          }
        }
      }

      return true
    } catch (e: any) {
      setErr(e.message);
      return false
    }
  }





  return <>
    <br />
    <Row className='full-width'>
      <Col md={24} xs={24} style={{ textAlign: 'center' }} className='primary-text'>
        <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>
          Custom JSON Form
        </Typography.Text>

        <div className='primary-text full-width' style={{ textAlign: 'center' }}>
          <WarningOutlined style={{ fontSize: 16, marginRight: 4, color: 'orange' }} />
          This is an advanced and experimental feature. Use at your own risk. Custom values may break the normal form UI now or in the future.
        </div>
        <div>
          If there are bugs or issues, please report them via our Discord or GitHub.
        </div> <br />
        See <a href="https://docs.bitbadges.io" target="_blank" rel="noreferrer">the BitBadges documentation</a> for more information.
        <br />
        <br />
      </Col>

      <Col md={12} xs={24} style={{ textAlign: 'center' }}>
        <b className='primary-text'>Enter JSON</b>
        <Input.TextArea
          rows={20}
          value={inputJson}

          className='primary-text inherit-bg'
          placeholder={'Enter JSON here'}
          onChange={(e) => {
            setInputJson(e.target.value);
            setErr('');

          }}
        />
        <br />
        <br />
        <Button
          type='primary'
          className='full-width styled-button primary-text'
          onClick={() => {
            setErr('');
            try {
              if (!collection) return;
              const msg = JSON.parse(inputJson);


              setCurrentValue(msg);

            } catch (e: any) {
              console.error(e);
              setErr(e.message);
            }
          }}
        >
          {'Set'}
        </Button>
        <br />
        <br />

      </Col>
      <Col md={12} xs={24} style={{ textAlign: 'center' }}>
        <b className='primary-text'>Selected Value</b>
        <Input.TextArea
          rows={20}
          value={JSON.stringify(currValue, null, 2)}
          style={{ cursor: 'not-allowed', backgroundColor: 'black', color: 'white' }}
          className='primary-text inherit-bg'
          placeholder={'Enter JSON here'}
          disabled
        />
      </Col>

    </Row>
  </>
}