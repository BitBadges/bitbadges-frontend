import { DistributionMethod } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";
import { Avatar, Col, Divider, List, Row, Typography } from "antd";
import { PRIMARY_TEXT, SECONDARY_TEXT } from "../../../constants";
import { tools } from "../../display/ToolIcon";

export function DistributionMethodStepItem(
  distributionMethod: DistributionMethod,
  setDistributionMethod: (newDistributionMethod: DistributionMethod) => void,
  fungible?: boolean,
  nonFungible?: boolean,
  hideUnminted: boolean = false,
  hideFirstComeFirstServe: boolean = false,
) {
  const options = [];
  if (!hideFirstComeFirstServe) {
    options.push({
      title: 'Open to Anyone',
      message: `First come, first serve. Limit one claim per address. ${fungible ? 'Any address can claim badges until the supply runs out.' : nonFungible ? 'The first user to claim will receive the badge with ID 1, the second user will receive ID 2, and so on until all badges are claimed.' : ''}`,
      isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
    });
  }
  options.push(
    {
      title: 'Codes',
      message: 'Generate secret codes or passwords that can be entered by users to claim badges. Codes can be distributed to users however you would like (via email, social media, etc) and can be distributed now or at a later time.',
      isSelected: distributionMethod == DistributionMethod.Codes,
    },
    {
      title: 'Whitelist',
      message: 'Distribute badges to specific addresses.',
      isSelected: distributionMethod == DistributionMethod.Whitelist,
    },
    {
      title: 'JSON',
      message: 'Advanced option. Upload a JSON file, specifying how to distribute your badges. See BitBadges documentation for more info.',
      isSelected: distributionMethod == DistributionMethod.JSON,
    }
  );

  if (!hideUnminted) {
    options.push({
      title: 'Unminted',
      message: 'Do nothing now. Leave the distribution of badges for a later time.',
      isSelected: distributionMethod == DistributionMethod.Unminted,
    })
  }



  return {
    title: `Distribution Method`,
    description: '',
    node: <div>
      <SwitchForm

        options={options}
        onSwitchChange={(_idx, newTitle) => {
          if (newTitle == 'Open to Anyone') {
            setDistributionMethod(DistributionMethod.FirstComeFirstServe);
          } else if (newTitle == 'Codes') {
            setDistributionMethod(DistributionMethod.Codes);
          } else if (newTitle == 'Whitelist') {
            setDistributionMethod(DistributionMethod.Whitelist);
          } else if (newTitle == 'JSON') {
            setDistributionMethod(DistributionMethod.JSON);
          } else if (newTitle == 'Unminted') {
            setDistributionMethod(DistributionMethod.Unminted);
          }
        }}
      />
      <Divider />
      <Divider />

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography.Text strong style={{ fontSize: 20, color: PRIMARY_TEXT, textAlign: 'center' }}>Tools</Typography.Text>
        <Typography.Text strong style={{ fontSize: 14, color: SECONDARY_TEXT, textAlign: 'center' }}>
          Below is a list of tools compatible with the BitBadges website.
          If you would like to use a specific tool, select the corresponding distribution method for that tool.
        </Typography.Text>

        <br />
        <Row>
          {/* Three columns */}
          <Col xs={24} sm={24} md={8}>
            <List
              style={{ textAlign: 'left', color: PRIMARY_TEXT }}
              itemLayout="horizontal"
              dataSource={tools.filter(x => x.distributionMethod === DistributionMethod.Codes).map(x => ({ title: x.name }))}
              header={
                <div style={{
                  textAlign: 'center'
                }}>
                  <Typography.Text strong style={{ fontSize: 16, color: PRIMARY_TEXT }}>Codes</Typography.Text>
                </div>}
              renderItem={(item, index) => {
                const tool = tools.find(tool => tool.name == item.title);
                if (!tool) {
                  return <></>
                }

                return <List.Item key={index}>
                  <List.Item.Meta
                    style={{ color: PRIMARY_TEXT }}
                    avatar={<Avatar src={tool?.icon} />}
                    title={<div style={{ color: PRIMARY_TEXT }}><a href={tool.url} target="_blank" rel="noreferrer">{item.title}</a></div>}
                    description={<div style={{ color: PRIMARY_TEXT }}>{tool.description}</div>}
                  />
                </List.Item>
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <List
              style={{ textAlign: 'left', color: PRIMARY_TEXT }}
              itemLayout="horizontal"
              dataSource={tools.filter(x => x.distributionMethod === DistributionMethod.Whitelist).map(x => ({ title: x.name }))}
              header={
                <div style={{
                  textAlign: 'center'
                }}>
                  <Typography.Text strong style={{ fontSize: 16, color: PRIMARY_TEXT }}>Whitelist</Typography.Text>
                </div>}
              renderItem={(item, index) => {
                const tool = tools.find(tool => tool.name == item.title);
                if (!tool) {
                  return <></>
                }

                return <List.Item key={index}>
                  <List.Item.Meta
                    style={{ color: PRIMARY_TEXT }}
                    avatar={<Avatar src={tool?.icon} />}
                    title={<div style={{ color: PRIMARY_TEXT }}><a href={tool.url} target="_blank" rel="noreferrer">{item.title}</a></div>}
                    description={<div style={{ color: PRIMARY_TEXT }}>{tool.description}</div>}
                  />
                </List.Item>
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <List
              style={{ textAlign: 'left', color: PRIMARY_TEXT }}
              itemLayout="horizontal"
              dataSource={tools.filter(x => x.distributionMethod === DistributionMethod.JSON).map(x => ({ title: x.name }))}
              header={
                <div style={{
                  textAlign: 'center'
                }}>
                  <Typography.Text strong style={{ fontSize: 16, color: PRIMARY_TEXT }}>JSON</Typography.Text>
                </div>}
              renderItem={(item, index) => {
                const tool = tools.find(tool => tool.name == item.title);
                if (!tool) {
                  return <></>
                }

                return <List.Item key={index}>
                  <List.Item.Meta
                    style={{ color: PRIMARY_TEXT }}
                    avatar={<Avatar src={tool?.icon} />}
                    title={<div style={{ color: PRIMARY_TEXT }}><a href={tool.url} target="_blank" rel="noreferrer">{item.title}</a></div>}
                    description={<div style={{ color: PRIMARY_TEXT }}>{tool.description}</div>}
                  />
                </List.Item>
              }}
            />
          </Col>
        </Row>

        <br />
      </div>
    </div>,
    disabled: distributionMethod == DistributionMethod.None
  }
}