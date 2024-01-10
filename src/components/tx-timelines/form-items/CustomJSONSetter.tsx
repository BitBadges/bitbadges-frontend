
import { WarningOutlined } from '@ant-design/icons';
import { Col, Input, Row, Typography } from 'antd';
import { getReservedAddressList } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';

const style = require('react-syntax-highlighter/dist/cjs/styles/prism').oneDark;

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
  setErr: (err: Error | null) => void,
  isPermissionUpdate?: boolean,
  customValue?: any,
  customSetValueFunction?: (val: any) => void
}) {


  const collection = useCollection(NEW_COLLECTION_ID);

  const [inputJson, setInputJson] = useState<string>('');

  if (!collection) return <></>;

  const currValue = customValue ? customValue : !isPermissionUpdate ? collection?.[jsonPropertyPath as keyof typeof collection] :
    collection.collectionPermissions?.[jsonPropertyPath as keyof typeof collection.collectionPermissions];

  const setCurrentValue =
    customSetValueFunction ? (val: any) => {
      try {
        customSetValueFunction(val);
      } catch (e: any) {
        setErr(e);
      }
    } : !isPermissionUpdate ? (val: any) => {
      const isValid = preClean(val);
      if (!isValid) return;

      updateCollection({
        collectionId: collection.collectionId,
        [`${jsonPropertyPath}`]: val
      });
    } : (val: any) => {
      const isValid = preClean(val);
      if (!isValid) return;

      updateCollection({
        collectionId: collection.collectionId,
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
          //TODO: Make this dynamic and ensure that the options are valid based on permission type
          if (el.fromListId && typeof el.fromListId !== 'string') throw new Error('fromListId must be a string');
          if (el.initiatedByListId && typeof el.initiatedByListId !== 'string') throw new Error('initiatedByListId must be a string');
          if (el.toListId && typeof el.toListId !== 'string') throw new Error('toListId must be a string');
          if (el.badgeIds && !validateUintRangeArr(el.badgeIds)) throw new Error('badgeIds must be an array of UintRange');
          if (el.ownershipTimes && !validateUintRangeArr(el.ownershipTimes)) throw new Error('ownershipTimes must be an array of UintRange');
          if (el.transferTimes && !validateUintRangeArr(el.transferTimes)) throw new Error('transferTimes must be an array of UintRange');
          if (el.permanentlyPermittedTimes && !validateUintRangeArr(el.permanentlyPermittedTimes)) throw new Error('permanentlyPermittedTimes must be an array of UintRange');
          if (el.permanentlyForbiddenTimes && !validateUintRangeArr(el.permanentlyForbiddenTimes)) throw new Error('permanentlyForbiddenTimes must be an array of UintRange');
          if (el.timelineTimes && !validateUintRangeArr(el.timelineTimes)) throw new Error('timelineTimes must be an array of UintRange');
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
          if (el.collectionApprovals && !Array.isArray(el.collectionApprovals)) throw new Error('collectionApprovals must be an array');
          if (el.collectionApprovals && el.collectionApprovals.length > 0) {
            for (const approval of el.collectionApprovals) {
              if (!approval.badgeIds || !validateUintRangeArr(approval.badgeIds)) throw new Error('approval.badgeIds must be an array of UintRange');
              if (!approval.ownershipTimes || !validateUintRangeArr(approval.ownershipTimes)) throw new Error('approval.ownershipTimes must be an array of UintRange');
              if (!approval.transferTimes || !validateUintRangeArr(approval.transferTimes)) throw new Error('approval.transferTimes must be an array of UintRange');
              if (!approval.fromListId || typeof approval.fromListId !== 'string') throw new Error('approval.fromListId must be a string');
              if (!approval.initiatedByListId || typeof approval.initiatedByListId !== 'string') throw new Error('approval.initiatedByListId must be a string');

              if (!approval.toListId || typeof approval.toListId !== 'string') throw new Error('approval.toListId must be a string');

              if (!approval.allowedCombinations || !Array.isArray(approval.allowedCombinations)) throw new Error('approval.allowedCombinations must be an array');
              for (const combo of approval.allowedCombinations) {
                //TODO: Add the rest of  the options 
                if (combo.isApproved === undefined || typeof combo.isApproved !== 'boolean') throw new Error('combo.isApproved must be a boolean');


              }

              if (!approval.approvalCriteria || !Array.isArray(approval.approvalCriteria)) throw new Error('approval.approvalCriteria must be an array');
              //TODO: Add approval details validation
              const fromList = getReservedAddressList(approval.fromListId);
              const initiatedByList = getReservedAddressList(approval.initiatedByListId);
              const toList = getReservedAddressList(approval.toListId);

              if (!approval.fromList && !fromList) {
                throw new Error('We currently do not support custom list IDs. Please enter it manually via fromList.');
              }

              if (!approval.initiatedByList && !initiatedByList) {
                throw new Error('We currently do not support custom list IDs. Please enter it manually via initiatedByList.');
              }

              if (!approval.toList && !toList) {
                throw new Error('We currently do not support custom list IDs. Please enter it manually via toList.');
              }

              approval.fromList = approval.fromList || fromList;
              approval.initiatedByList = approval.initiatedByList || initiatedByList;
              approval.toList = approval.toList || toList;
            }
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
          <WarningOutlined style={{ fontSize: 16, marginRight: 4, color: '#FF5733' }} />
          This is an advanced and experimental feature. Use at your own risk. Custom values may break the normal form now or in the future.
        </div>
        <div>
          If there are bugs or issues, please report them via our Discord or GitHub.

          See <a href="https://docs.bitbadges.io" target="_blank" rel="noreferrer">the BitBadges documentation</a> for more information.
        </div>
        <br />
        <br />
      </Col>

      <InformationDisplayCard title='' md={12} xs={24} style={{ textAlign: 'center' }}>
        <b className='primary-text'>Enter Value</b>
        <SyntaxHighlighter language="json" style={style}>
          {inputJson}
        </SyntaxHighlighter>
        <Input.TextArea
          value={inputJson}
          rows={15}
          className='primary-text inherit-bg'
          placeholder={'Enter your value here here'}
          onChange={(e) => {
            setInputJson(e.target.value);
            setErr(null);

          }}
        />


        <br />
        <br />
        <button
          className='full-width landing-button primary-text'
          style={{ width: '100%' }}
          onClick={() => {
            setErr(null);
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
        </button>
        <br />
        <br />

      </InformationDisplayCard>
      <InformationDisplayCard title='' md={12} xs={24} style={{ textAlign: 'center' }}>
        <b className='primary-text'>Set Value</b>

        <SyntaxHighlighter language="json" style={style}>
          {JSON.stringify(currValue, null, 2)}
        </SyntaxHighlighter>

      </InformationDisplayCard>

    </Row>
  </>
}