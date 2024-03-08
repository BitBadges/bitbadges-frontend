import { Switch } from 'antd';
import { ClaimIntegrationPluginType, IntegrationPluginDetails } from 'bitbadgesjs-sdk';
import { useCallback, useEffect, useState } from 'react';
import { Plugins, getBlankPlugin, getPlugin, getPluginDetails } from '../../integrations/integrations';
import { PluginTextDisplay } from '../collection-page/transferability/DetailsCard';
import { ClaimCriteriaDisplay } from '../collection-page/transferability/OffChainTransferabilityTab';
import { ErrDisplay } from '../common/ErrDisplay';
import { TableRow } from '../display/TableRow';
import { RadioGroup } from '../inputs/Selects';
import { Tabs } from '../navigation/Tabs';

export const ClaimBuilder = ({
  plugins,
  setPlugins,
  offChainSelect,
  setDisabled,
  isUpdate
}: {
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  setPlugins: (plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[]) => void;
  offChainSelect?: boolean;
  setDisabled: (disabled: boolean) => void;
  isUpdate: boolean;
}) => {
  const [disabledMap, setDisabledMap] = useState<{ [key: string]: string }>({});
  const [tab, setTab] = useState('criteria');

  useEffect(() => {
    setDisabled(Object.keys(disabledMap).some((x) => disabledMap[x] && plugins.find((y) => y.id == x)) || plugins.length === 0);
  }, [disabledMap, plugins, setDisabled]);

  return (
    <>
      <div className="flex-center">
        {' '}
        <Tabs
          type="underline"
          tab={tab}
          setTab={setTab}
          tabInfo={[
            {
              content: 'Criteria',
              key: 'criteria'
            },
            {
              content: 'Preview',
              key: 'preview'
            }
          ]}
        />
      </div>
      {tab == 'preview' && (
        <>
          <div className="p-4 secondary-text text-center">This is just a preview. State data may not be accurate.</div>
          <div className="p-4">
            <ClaimCriteriaDisplay plugins={plugins} />
          </div>
          <br />
          <div className="flex-center">
            <button className="landing-button" disabled={true}>
              Claim
            </button>
          </div>
        </>
      )}
      {tab == 'criteria' && (
        <>
          {!plugins.find((x) => x.id === 'numUses') && <ErrDisplay err={'You must restrict the number of uses.'} />}
          <br />
          {Object.keys(Plugins).map((_id: string) => {
            const id = _id as ClaimIntegrationPluginType;
            const pluginInstance = getPlugin(id);
            if (!pluginInstance.metadata.onChainCompatible && !offChainSelect) return null;

            return (
              <ClaimBuilderRow
                isUpdate={isUpdate}
                key={id}
                disabledMap={disabledMap}
                id={id}
                plugins={plugins}
                setPlugins={setPlugins}
                setDisabledMap={setDisabledMap}
              />
            );
          })}
        </>
      )}
    </>
  );
};

const ClaimBuilderRow = ({
  id,
  plugins,
  setPlugins,
  disabledMap,
  setDisabledMap,
  isUpdate
}: {
  id: ClaimIntegrationPluginType;
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  setPlugins: (plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[]) => void;
  disabledMap: { [key: string]: string };
  setDisabledMap: (disabledMap: { [key: string]: string }) => void;
  isUpdate?: boolean;
}) => {
  const pluginInstance = getPlugin(id);
  const currPlugin = getPluginDetails(id, plugins);

  const setDisabled = useCallback((disabled: string) => {
    setDisabledMap({ ...disabledMap, [id]: disabled });
  }, []);

  if (!pluginInstance) return <></>;
  if (!pluginInstance.createNode) return null;

  return (
    <div key={id}>
      <TableRow
        labelSpan={16}
        valueSpan={8}
        label={<PluginTextDisplay pluginId={id} text={<b>{pluginInstance.metadata.name}</b>} />}
        value={
          <Switch
            checked={!!currPlugin}
            disabled={!!currPlugin && id == 'numUses'}
            onChange={(checked) => {
              if (checked) {
                setPlugins([
                  ...plugins,
                  {
                    ...getBlankPlugin(id),
                    resetState: isUpdate ? false : true
                  }
                ]);
              } else {
                setPlugins(plugins.filter((x) => x.id !== id));
                setDisabledMap({ ...disabledMap, [id]: '' });
              }
            }}
          />
        }
      />

      <TableRow
        labelSpan={24}
        valueSpan={0}
        label={
          <div className="secondary-text" style={{ fontSize: 12 }}>
            {pluginInstance.metadata.description}
          </div>
        }
        value={<></>}
      />
      {!!currPlugin && isUpdate && !pluginInstance.metadata.stateless && (
        <div className="flex-center flex-column mb-8">
          <RadioGroup
            value={currPlugin.resetState ? 'yes' : 'no'}
            onChange={(e) => {
              setPlugins(
                plugins.map((x) => {
                  if (x.id === id) {
                    return {
                      ...x,
                      resetState: e === 'yes'
                    };
                  }
                  return x;
                })
              );
            }}
            options={[
              {
                label: 'Reset State',
                value: 'yes'
              },
              {
                label: 'Keep State',
                value: 'no'
              }
            ]}
          />
          <div className="secondary-text mt-2">Reset the state? {pluginInstance.stateString()}</div>
        </div>
      )}
      {currPlugin &&
        pluginInstance.createNode({
          disabled: disabledMap[id],
          setDisabled: setDisabled,
          numClaims: getPluginDetails('numUses', plugins)?.publicParams?.maxUses || 0,
          id: id,
          metadata: pluginInstance.metadata,
          privateParams: currPlugin.privateParams,
          publicParams: currPlugin.publicParams,
          setParams: (publicParams, privateParams) => {
            setPlugins(
              plugins.map((x) => {
                if (x.id === id) {
                  return {
                    ...x,
                    publicParams: publicParams,
                    privateParams: privateParams
                  };
                }
                return x;
              })
            );
          }
        })}
      <br />
    </div>
  );
};
