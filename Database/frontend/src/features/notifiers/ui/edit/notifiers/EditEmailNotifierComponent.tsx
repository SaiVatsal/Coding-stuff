import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { Checkbox, Input, Tooltip } from 'antd';
import { useState } from 'react';

import type { Notifier } from '../../../../../entity/notifiers';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditEmailNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const hasAdvancedValues = !!notifier?.emailNotifier?.isInsecureSkipVerify;
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  return (
    <>
      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">Target email</div>
        <div className="flex items-center">
          <Input
            value={notifier?.emailNotifier?.targetEmail || ''}
            onChange={(e) => {
              if (!notifier?.emailNotifier) return;

              setNotifier({
                ...notifier,
                emailNotifier: {
                  ...notifier.emailNotifier,
                  targetEmail: e.target.value.trim(),
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="example@gmail.com"
          />

          <Tooltip
            className="cursor-pointer"
            title="The email where you want to receive the message"
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">SMTP host</div>
        <Input
          value={notifier?.emailNotifier?.smtpHost || ''}
          onChange={(e) => {
            if (!notifier?.emailNotifier) return;

            setNotifier({
              ...notifier,
              emailNotifier: {
                ...notifier.emailNotifier,
                smtpHost: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="smtp.gmail.com"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">SMTP port</div>
        <Input
          type="number"
          value={notifier?.emailNotifier?.smtpPort || ''}
          onChange={(e) => {
            if (!notifier?.emailNotifier) return;

            setNotifier({
              ...notifier,
              emailNotifier: {
                ...notifier.emailNotifier,
                smtpPort: Number(e.target.value),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="25"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">SMTP user</div>
        <Input
          value={notifier?.emailNotifier?.smtpUser || ''}
          onChange={(e) => {
            if (!notifier?.emailNotifier) return;

            setNotifier({
              ...notifier,
              emailNotifier: {
                ...notifier.emailNotifier,
                smtpUser: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="user@gmail.com"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">SMTP password</div>
        <Input
          type="password"
          value={notifier?.emailNotifier?.smtpPassword || ''}
          onChange={(e) => {
            if (!notifier?.emailNotifier) return;

            setNotifier({
              ...notifier,
              emailNotifier: {
                ...notifier.emailNotifier,
                smtpPassword: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="password"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">From</div>
        <div className="flex items-center">
          <Input
            value={notifier?.emailNotifier?.from || ''}
            onChange={(e) => {
              if (!notifier?.emailNotifier) return;

              setNotifier({
                ...notifier,
                emailNotifier: {
                  ...notifier.emailNotifier,
                  from: e.target.value.trim(),
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="example@example.com"
          />

          <Tooltip
            className="cursor-pointer"
            title="Optional. Email address to use as sender. If empty, will use SMTP user or auto-generate from host"
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="mt-4 mb-3 flex items-center">
        <div
          className="flex cursor-pointer items-center text-sm text-blue-600 hover:text-blue-800"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="mr-2">Advanced settings</span>

          {showAdvanced ? (
            <UpOutlined style={{ fontSize: '12px' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px' }} />
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">Skip TLS verify</div>
          <div className="flex items-center">
            <Checkbox
              checked={notifier?.emailNotifier?.isInsecureSkipVerify || false}
              onChange={(e) => {
                if (!notifier?.emailNotifier) return;

                setNotifier({
                  ...notifier,
                  emailNotifier: {
                    ...notifier.emailNotifier,
                    isInsecureSkipVerify: e.target.checked,
                  },
                });
                setUnsaved();
              }}
            >
              Skip TLS
            </Checkbox>

            <Tooltip
              className="cursor-pointer"
              title="Skip TLS certificate verification. Enable this if your SMTP server uses a self-signed certificate. Warning: this reduces security."
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>
        </div>
      )}
    </>
  );
}
