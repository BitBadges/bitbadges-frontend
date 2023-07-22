import { DistributionMethod } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";
import { Avatar, Col, Divider, List, Row, Typography } from "antd";
import { tools } from "../../display/ToolIcon";
import { Balance } from "bitbadgesjs-proto";

export function DistributionMethodStepItem(
  distributionMethod: DistributionMethod,
  setDistributionMethod: (newDistributionMethod: DistributionMethod) => void,
  badgesToCreate: Balance<bigint>[],
  hideUnminted: boolean = false,
  hideFirstComeFirstServe: boolean = false,
) {
  //If all supply amounts are 1, it is fungible
  const fungible = badgesToCreate.length === 1 && badgesToCreate[0].badgeIds.length == 1 && badgesToCreate[0].badgeIds[0].start == badgesToCreate[0].badgeIds[0].end;
  const nonFungible = badgesToCreate.every(badgeSupply => badgeSupply.amount === 1n);

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
      message: 'Specific addresses will be able to claim this badge.',
      isSelected: distributionMethod == DistributionMethod.Whitelist,
    },
    {
      title: 'Off-Chain Balances',
      message: 'Badges are stored on the blockchain, but all balances are stored off-chain to make it less expensive. Because balances are off-chain, they must either a) be permanent and frozen forever or b) only updatable by the manager of the collection.',
      isSelected: distributionMethod == DistributionMethod.Whitelist,
    },
    {
      title: 'Direct Transfer',
      message: 'Directly send badges to specific addresses. You will pay all transfer fees.',
      isSelected: distributionMethod == DistributionMethod.DirectTransfer,
    },
    // {
    //   title: 'JSON',
    //   message: 'Advanced option. Upload a JSON file, specifying how to distribute your badges. See BitBadges documentation for more info.',
    //   isSelected: distributionMethod == DistributionMethod.JSON,
    // }
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

      <div className='flex-center flex-wrap'>
        <Typography.Text strong className='primary-text' style={{ fontSize: 20, textAlign: 'center' }}>Tools</Typography.Text>
        <Typography.Text strong className='secondary-text' style={{ fontSize: 14, textAlign: 'center' }}>
          Below is a list of tools compatible with the BitBadges website.
          If you would like to use a specific tool, select the corresponding distribution method for that tool.
        </Typography.Text>

        <br />
        <Row>
          {/* Three columns */}
          <Col xs={24} sm={24} md={8}>
            <List
              style={{ textAlign: 'left' }} className='primary-text'
              itemLayout="horizontal"
              dataSource={tools.filter(x => x.distributionMethod === DistributionMethod.Codes).map(x => ({ title: x.name }))}
              header={
                <div style={{
                  textAlign: 'center'
                }}>
                  <Typography.Text strong style={{ fontSize: 16 }} className='primary-text'>Codes</Typography.Text>
                </div>}
              renderItem={(item, index) => {
                const tool = tools.find(tool => tool.name == item.title);
                if (!tool) {
                  return <></>
                }

                return <List.Item key={index}>
                  <List.Item.Meta
                    className='primary-text'
                    avatar={<Avatar src={tool?.icon} />}
                    title={<div className='primary-text'><a href={tool.url} target="_blank" rel="noreferrer">{item.title}</a></div>}
                    description={<div className='primary-text'>{tool.description}</div>}
                  />
                </List.Item>
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <List
              style={{ textAlign: 'left' }} className='primary-text'
              itemLayout="horizontal"
              dataSource={tools.filter(x => x.distributionMethod === DistributionMethod.Whitelist).map(x => ({ title: x.name }))}
              header={
                <div style={{
                  textAlign: 'center'
                }}>
                  <Typography.Text strong style={{ fontSize: 16 }} className='primary-text'>Whitelist</Typography.Text>
                </div>}
              renderItem={(item, index) => {
                const tool = tools.find(tool => tool.name == item.title);
                if (!tool) {
                  return <></>
                }

                return <List.Item key={index}>
                  <List.Item.Meta
                    className='primary-text'
                    avatar={<Avatar src={tool?.icon} />}
                    title={<div className='primary-text'><a href={tool.url} target="_blank" rel="noreferrer">{item.title}</a></div>}
                    description={<div className='primary-text'>{tool.description}</div>}
                  />
                </List.Item>
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <List
              style={{ textAlign: 'left' }} className='primary-text'
              itemLayout="horizontal"
              dataSource={tools.filter(x => x.distributionMethod === DistributionMethod.JSON).map(x => ({ title: x.name }))}
              header={
                <div style={{
                  textAlign: 'center'
                }}>
                  <Typography.Text strong style={{ fontSize: 16 }} className='primary-text'>JSON</Typography.Text>
                </div>}
              renderItem={(item, index) => {
                const tool = tools.find(tool => tool.name == item.title);
                if (!tool) {
                  return <></>
                }

                return <List.Item key={index}>
                  <List.Item.Meta
                    className='primary-text'
                    avatar={<Avatar src={tool?.icon} />}
                    title={<div className='primary-text'><a href={tool.url} target="_blank" rel="noreferrer">{item.title}</a></div>}
                    description={<div className='primary-text'>{tool.description}</div>}
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