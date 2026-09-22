import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Input, Spin, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

import { healthcheckConfigApi } from '../../../entity/healthcheck';
import type { HealthcheckConfig } from '../../../entity/healthcheck';

interface Props {
  databaseId: string;
  onClose: () => void;
}

export const EditHealthcheckConfigComponent = ({ databaseId, onClose }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [healthcheckConfig, setHealthcheckConfig] = useState<HealthcheckConfig | undefined>(
    undefined,
  );

  const handleSave = async () => {
    if (!healthcheckConfig) return;

    setIsSaving(true);

    try {
      await healthcheckConfigApi.saveHealthcheckConfig(healthcheckConfig);
      setIsUnsaved(false);
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }

    setIsSaving(false);
  };

  useEffect(() => {
    setIsLoading(true);
    healthcheckConfigApi
      .getHealthcheckConfig(databaseId)
      .then((config) => {
        setHealthcheckConfig(config);
      })
      .catch((error) => {
        alert(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [databaseId]);

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (!healthcheckConfig) {
    return <div />;
  }

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center">
        <div className="min-w-[180px]">Enable healthcheck</div>
        <Switch
          checked={healthcheckConfig.isHealthcheckEnabled}
          onChange={(checked) => {
            setHealthcheckConfig({
              ...healthcheckConfig,
              isHealthcheckEnabled: checked,
            });
            setIsUnsaved(true);
          }}
          size="small"
        />

        <Tooltip
          className="cursor-pointer"
          title="Enable or disable healthcheck monitoring for this database"
        >
          <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
        </Tooltip>
      </div>

      {healthcheckConfig.isHealthcheckEnabled && (
        <>
          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">Notify when unavailable</div>

            <Switch
              checked={healthcheckConfig.isSentNotificationWhenUnavailable}
              onChange={(checked) => {
                setHealthcheckConfig({
                  ...healthcheckConfig,
                  isSentNotificationWhenUnavailable: checked,
                });
                setIsUnsaved(true);
              }}
              size="small"
            />

            <Tooltip
              className="cursor-pointer"
              title="Send notifications when database becomes unavailable"
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">Check interval (minutes)</div>

            <Input
              type="number"
              value={healthcheckConfig.intervalMinutes}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value > 0) {
                  setHealthcheckConfig({
                    ...healthcheckConfig,
                    intervalMinutes: value,
                  });
                  setIsUnsaved(true);
                }
              }}
              size="small"
              className="w-full max-w-[250px]"
              placeholder="5"
              min={1}
            />

            <Tooltip
              className="cursor-pointer"
              title="How often to check database health (in minutes)"
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">Attempts before down</div>

            <Input
              type="number"
              value={healthcheckConfig.attemptsBeforeConcideredAsDown}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value > 0) {
                  setHealthcheckConfig({
                    ...healthcheckConfig,
                    attemptsBeforeConcideredAsDown: value,
                  });
                  setIsUnsaved(true);
                }
              }}
              size="small"
              className="w-full max-w-[250px]"
              placeholder="3"
              min={1}
            />

            <Tooltip
              className="cursor-pointer"
              title="Number of failed attempts before marking database as down"
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">Store attempts (days)</div>

            <Input
              type="number"
              value={healthcheckConfig.storeAttemptsDays}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value > 0) {
                  setHealthcheckConfig({
                    ...healthcheckConfig,
                    storeAttemptsDays: value,
                  });
                  setIsUnsaved(true);
                }
              }}
              size="small"
              className="w-full max-w-[250px]"
              placeholder="30"
              min={1}
            />

            <Tooltip
              className="cursor-pointer"
              title="How many days to store health check attempt history"
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>
        </>
      )}

      <div className="mt-6 flex justify-end space-x-2">
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>

        <Button type="primary" onClick={handleSave} loading={isSaving} disabled={!isUnsaved}>
          Save
        </Button>
      </div>
    </div>
  );
};
