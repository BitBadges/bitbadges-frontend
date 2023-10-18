import { Empty, Form, Input, Typography } from "antd";
import { MerkleChallengeDetails } from "bitbadgesjs-utils";
import { EmptyStepItem } from "../../bitbadges-api/contexts/TxTimelineContext";

export function ClaimMetadataSelect({
  merkleChallengeDetails,
  setMerkleChallengeDetails,
}: {
  merkleChallengeDetails: MerkleChallengeDetails<bigint> | undefined,
  setMerkleChallengeDetails: (merkleChallengeDetails: MerkleChallengeDetails<bigint>) => void,
}) {
  return <>{ClaimMetadataSelectSelectStep(merkleChallengeDetails, setMerkleChallengeDetails).description}</>
}

export function ClaimMetadataSelectSelectStep(
  merkleChallengeDetails: MerkleChallengeDetails<bigint> | undefined,
  setMerkleChallengeDetails: (merkleChallengeDetails: MerkleChallengeDetails<bigint>) => void,
) {
  if (!merkleChallengeDetails) return EmptyStepItem

  const name = merkleChallengeDetails.name;
  const description = merkleChallengeDetails.description;

  const setName = (name: string) => {
    setMerkleChallengeDetails({
      ...merkleChallengeDetails,
      name,
    });
  }

  const setDescription = (description: string) => {
    setMerkleChallengeDetails({
      ...merkleChallengeDetails,
      description,
    });
  }

  return {
    title: 'Metadata',
    description: <div>
      <>
        <br />
        <br />
        <Form
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
        >
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
            <Form.Item
              label={<>
                <Typography.Text className='primary-text' strong>
                  Name
                </Typography.Text >
              </>}
            >
              <Input
                defaultValue={name}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                className="form-input inherit-bg primary-text"
              />
            </Form.Item>
            <Form.Item
              label={<>
                <Typography.Text className='primary-text' strong>
                  Description
                </Typography.Text>
              </>}
            >
              <Input.TextArea
                defaultValue={description}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                className="form-input inherit-bg primary-text"
                rows={7}
              />
            </Form.Item>
          </div>
        </Form>
      </>
    </div>,
    // disabled: !merkleChallengeDetails.name || !merkleChallengeDetails.description,
  }
}