import { Form, Input, Typography } from "antd";
import { MerkleChallengeDetails } from "bitbadgesjs-utils";

export function ClaimMetadataSelectSelectStep(
  merkleChallengeDetails: MerkleChallengeDetails<bigint>,
  setMerkleChallengeDetails: (merkleChallengeDetails: MerkleChallengeDetails<bigint>) => void,
) {
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
    title: 'Confirm',
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
                className="form-input"
              />
              <Typography.Text strong className='secondary-text'>
                Give this claim a name.
              </Typography.Text>
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
                className="form-input"
                rows={7}
              />
              <Typography.Text strong className='secondary-text'>
                Describe how users can earn this badge.
              </Typography.Text>
            </Form.Item>
          </div>
        </Form>
      </>
    </div>,
    disabled: !merkleChallengeDetails.name || !merkleChallengeDetails.description,
  }
}