import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, Divider, Empty, Row, Tooltip, Typography } from "antd";
import { CollectionApprovedTransferWithDetails } from "bitbadgesjs-utils";
import { useState } from "react";
import { QRCode } from 'react-qrcode-logo';
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { WEBSITE_HOSTNAME } from "../../constants";
import { downloadJson, downloadTxt } from "../../utils/downloadJson";
import { Pagination } from "../common/Pagination";
import { ToolIcon, tools } from "../display/ToolIcon";

export function CodesDisplay({
  approvedTransfer,
  collectionId,
  codes,
  claimPassword,
}: {
  approvedTransfer: CollectionApprovedTransferWithDetails<bigint>,
  collectionId: bigint,
  codes?: string[]
  claimPassword?: string
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  const approvalDetails = approvedTransfer.approvalDetails;
  const merkleChallenge = approvalDetails ? approvalDetails.merkleChallenge : undefined;

  const claimId = approvedTransfer.challengeTrackerId;
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === claimId);

  const [codePage, setCodePage] = useState(1);

  const printStr = merkleChallenge?.details?.hasPassword ? 'password' : 'code';
  const urlSuffix = merkleChallenge?.details?.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';

  return <Card
    className="primary-text inherit-bg"
    style={{
      // margin: 8,
      textAlign: 'center',
      border: 'none',
      overflowWrap: 'break-word',
    }}

  >

    {/* // Show authenticated manager information (passwords, codes, distribution methods, etc...) */}

    <Row className='flex-center flex-column' style={{ textAlign: 'center', width: '100%' }}>

      <div>
        {"There are multiple ways to distribute. Select the option that best suits your needs. Keep these codes safe and secure!"}
      </div>
      <br />


      {!merkleChallenge?.details?.hasPassword && codes && codes.length > 0 && <>
        <div>
          <Typography.Text strong className='primary-text' style={{ fontSize: 22 }}>Step 1: Fetch Codes</Typography.Text>
          <br />
          <br />
          <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Option 1: Copy / Download Codes</Typography.Text>
          <br />
          <div style={{ textAlign: 'center' }}>
            <div>
              Download a{' '}
              <button
                style={{
                  backgroundColor: 'inherit',
                }}
                onClick={() => {
                  alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                  const today = new Date();

                  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                  const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                  downloadJson({
                    prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=ADD_CODE_HERE',
                    codes,
                    codeUrls: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x)
                  }, `codes-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.json`);
                }}
                className="opacity link-button primary-text"
              >
                JSON file
              </button>
              {' '}or a text file of the{' '}
              <button
                style={{
                  backgroundColor: 'inherit',
                }}
                onClick={() => {
                  alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                  const today = new Date();

                  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                  const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                  downloadTxt(codes.join('\n'), `codes-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.txt`);
                }}
                className="opacity link-button primary-text"
              >
                codes
              </button>
              {' or '}
              <button
                style={{
                  backgroundColor: 'inherit',
                }}
                onClick={() => {
                  alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                  const today = new Date();

                  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                  const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                  downloadTxt(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x).join('\n'), `code-urls-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.txt`);
                }}
                className="opacity link-button primary-text"
              >
                URLs
              </button>
            </div>
            <div>
              <div>
                Click here
                <Typography.Text copyable={{ text: codes.join('\n') }} className='primary-text' style={{ fontSize: 16 }}>
                  {" "}
                </Typography.Text>
                {" "}
                to copy the codes to your clipboard.
              </div>
              <div>
                Click here
                <Typography.Text copyable={{
                  text: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x).join('\n')
                }} className='primary-text' style={{ fontSize: 16 }}>
                  {" "}
                </Typography.Text>
                {" "}
                to copy the URLs to your clipboard.
              </div>

            </div>
            <div>
              Use a service like <a href="https://qrexplore.com/generate/" target="_blank" rel="noopener noreferrer">this QR code generator</a> to generate QR codes in batch for each unique URL.
            </div>
          </div>
          <Divider />
        </div>

        <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Option 2: Fetch Individual Codes</Typography.Text>

        <br />
      </>
      }
      {claimPassword && <div>
        <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> Password: {claimPassword}</Typography.Text>
      </div>}
      <br />
      <Pagination
        currPage={codePage}
        total={Number(codes?.length ?? 0n)}
        pageSize={1}
        onChange={(page) => {
          setCodePage(page);
        }}
      // size='small'
      // showSizeChanger={false}

      />
      <br />
      {merkleChallenge && !merkleChallenge.details?.hasPassword && merkleChallenge.maxOneUsePerLeaf && codes && <Typography.Text strong className='secondary-text'>
        <InfoCircleOutlined /> Note that this code can only be used once.
        <br />
        Current Status: {
          challengeTracker && (challengeTracker.usedLeafIndices?.find(x => x == BigInt(codePage - 1)) ?? -1) >= 0 ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
        }
      </Typography.Text>}

      <br />
      <br />
      <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> Manual</Typography.Text>
      <br />
      <Tooltip color='black' title={`Code: ${codes?.[codePage - 1] ?? ''}`}>
        <Typography.Text strong className='primary-text' style={{ fontSize: 14, textOverflow: 'ellipsis' }} copyable={{ text: codes?.[codePage - 1] ?? '' }}>
          Click here to copy code
        </Typography.Text>
      </Tooltip>
      <br />
      <Typography.Text className='secondary-text'>
        Users can directly enter this {printStr} on the claim page.
      </Typography.Text>
      <br />
      <br />
      <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> URL</Typography.Text>
      <br />
      <Tooltip color='black' title={`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`}>
        <Typography.Text className='primary-text' strong style={{ fontSize: 14, textOverflow: 'ellipsis' }} copyable={{ text: `${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}` }}>
          Click here to copy URL
        </Typography.Text>
      </Tooltip>
      <br />

      <Typography.Text className='secondary-text'>
        When a user navigates to the above URL, the {printStr} will be automatically inputted.
      </Typography.Text>
      <br />
      <br />
      <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> QR Code</Typography.Text>
      <br />
      <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`} />
      <br />

      <Typography.Text className='secondary-text'>
        When a user scans this QR code, it will take them to the claim page with the {printStr} automatically inputted.
      </Typography.Text>

    </Row>
    <div>
      <Divider />
      <Typography.Text strong className='primary-text' style={{ fontSize: 22 }}>Step 2: Distribute</Typography.Text>
      <br />
      <br />
      <div>
        {"Once you have the codes downloaded and ready to distribute, you can distribute them according to your preferred method. You may find some of the tools below helpful."}
      </div>
      <div>
        <WarningOutlined style={{ color: 'orange', marginRight: 4 }} />
        {"Some of these are third-party tools. Use at your own risk."}
      </div>
      <br />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {tools.map((tool, idx) => {
          if (tool.toolType !== "Distribution" || tool.native) return <></>

          return <div style={{
            margin: 8, display: 'flex'
          }} key={idx}>
            <ToolIcon
              name={tool.name
              }
            />
          </div>
        })}
      </div>
    </div>
    {merkleChallenge && !merkleChallenge.details?.hasPassword && (!codes || codes.length === 0) &&
      <Empty
        description={<span className='primary-text'>There are no {printStr}s for this claim.</span>}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className='primary-text'
      />}
  </Card >
}