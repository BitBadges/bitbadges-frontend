import { Layout, Spin } from 'antd';
import { BigIntify, BlockinAuthSignatureDoc, convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { ChallengeParams, constructChallengeObjectFromString } from 'blockin';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAuthCode } from '../../bitbadges-api/api';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { AuthCode } from '../account/codes';

const { Content } = Layout;

function QRCode() {
  const router = useRouter();
  const { code, name, description, image } = router.query;

  const [params, setParams] = useState<ChallengeParams<bigint>>();

  useEffect(() => {
    if (params) return;
    if (!code) return;

    async function getParams() {
      const authCode = await getAuthCode({ signature: code as string });
      if (!authCode) return;
      const message = authCode.message;
      const params = constructChallengeObjectFromString(message, BigIntify);
      setParams(params);
    }

    getParams();
  }, [code, params]);

  if (!code)
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );

  const qrCode = code as string;
  return (
    <Content className="full-area" style={{ minHeight: '100vh', padding: 8 }}>
      <div className="flex-center">
        {qrCode && params && (
          <InformationDisplayCard md={12} xs={24} title="" style={{ marginTop: 16, textAlign: 'left' }}>
            <div className="flex-center">
              <AuthCode
                ported
                onlyShowCode
                setSavedAuthCodes={() => {}}
                authCode={
                  new BlockinAuthSignatureDoc({
                    _docId: '',
                    signature: qrCode,
                    name: (name as string) ?? '',
                    description: (description as string) ?? '',
                    image: (image as string) ?? '',
                    params: params,
                    createdAt: BigInt(Date.now()),
                    cosmosAddress: convertToCosmosAddress(params?.address)
                  })
                }
              />
            </div>
          </InformationDisplayCard>
        )}
      </div>
    </Content>
  );
}

export default QRCode;
