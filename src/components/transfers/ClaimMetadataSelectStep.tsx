import { Form, Input, Typography } from "antd";
import { ApprovalInfoDetails } from "bitbadgesjs-utils";
import { EmptyStepItem } from "../../bitbadges-api/contexts/TxTimelineContext";

export function ClaimMetadataSelect({
  approvalDetails,
  setApprovalDetails,
}: {
  approvalDetails: ApprovalInfoDetails<bigint> | undefined,
  setApprovalDetails: (approvalDetails: ApprovalInfoDetails<bigint>) => void,
}) {
  return <>{ClaimMetadataSelectSelectStep(approvalDetails, setApprovalDetails).description}</>
}

export function ClaimMetadataSelectSelectStep(
  approvalDetails: ApprovalInfoDetails<bigint> | undefined,
  setApprovalDetails: (approvalDetails: ApprovalInfoDetails<bigint>) => void,
) {
  if (!approvalDetails) return EmptyStepItem

  const name = approvalDetails.name;
  const description = approvalDetails.description;

  const setName = (name: string) => {
    setApprovalDetails({
      ...approvalDetails,
      name,
    });
  }

  const setDescription = (description: string) => {
    setApprovalDetails({
      ...approvalDetails,
      description,
    });
  }

  return {
    title: 'Metadata',
    description: <div>
      <>
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
    // disabled: !approvalDetails.name || !approvalDetails.description,
  }
}