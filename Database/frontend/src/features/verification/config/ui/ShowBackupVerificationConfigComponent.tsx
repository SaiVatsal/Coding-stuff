import { Spin } from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { IntervalType } from '../../../../entity/intervals';
import {
  type BackupVerificationConfig,
  VerificationNotificationType,
  VerificationScheduleType,
  verificationConfigApi,
} from '../../../../entity/verification/config';
import { getUserTimeFormat } from '../../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
} from '../../../../shared/time/utils';

interface Props {
  databaseId: string;
}

const weekdayLabels: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

const intervalLabels: Record<IntervalType, string> = {
  [IntervalType.HOURLY]: 'Hourly',
  [IntervalType.DAILY]: 'Daily',
  [IntervalType.WEEKLY]: 'Weekly',
  [IntervalType.MONTHLY]: 'Monthly',
  [IntervalType.CRON]: 'Cron',
};

const notificationLabels: Record<VerificationNotificationType, string> = {
  [VerificationNotificationType.VerificationSuccess]: 'Verification success',
  [VerificationNotificationType.VerificationFailed]: 'Verification failed',
};

export const ShowBackupVerificationConfigComponent = ({ databaseId }: Props) => {
  const [config, setConfig] = useState<BackupVerificationConfig>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    verificationConfigApi
      .getByDatabaseId(databaseId)
      .then(setConfig)
      .catch((error: Error) => alert(error.message))
      .finally(() => setIsLoading(false));
  }, [databaseId]);

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (!config) return <div />;

  const is12Hour = getIs12Hour();
  const timeFormat = { use12Hours: is12Hour, format: is12Hour ? 'h:mm A' : 'HH:mm' };
  const dateTimeFormat = getUserTimeFormat();

  const { verificationInterval } = config;

  const localTime = verificationInterval?.timeOfDay
    ? dayjs.utc(verificationInterval.timeOfDay, 'HH:mm').local()
    : undefined;

  const formattedTime = localTime ? localTime.format(timeFormat.format) : '';

  const displayedWeekday: number | undefined =
    verificationInterval?.type === IntervalType.WEEKLY &&
    verificationInterval.weekday &&
    verificationInterval.timeOfDay
      ? getLocalWeekday(verificationInterval.weekday, verificationInterval.timeOfDay)
      : verificationInterval?.weekday;

  const displayedDayOfMonth: number | undefined =
    verificationInterval?.type === IntervalType.MONTHLY &&
    verificationInterval.dayOfMonth &&
    verificationInterval.timeOfDay
      ? getLocalDayOfMonth(verificationInterval.dayOfMonth, verificationInterval.timeOfDay)
      : verificationInterval?.dayOfMonth;

  const isAfterBackup = config.scheduleType === VerificationScheduleType.AFTER_BACKUP;

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[180px]">Scheduled verification</div>
        <div className={config.isScheduledVerificationEnabled ? '' : 'text-gray-500'}>
          {config.isScheduledVerificationEnabled ? 'Yes' : 'No'}
        </div>
      </div>

      {config.isScheduledVerificationEnabled && (
        <>
          <div className="mt-5 mb-1 flex w-full items-center">
            <div className="min-w-[180px]">Verification interval</div>
            <div>
              {isAfterBackup
                ? 'After backup'
                : verificationInterval?.type
                  ? intervalLabels[verificationInterval.type]
                  : ''}
            </div>
          </div>

          {!isAfterBackup && verificationInterval?.type === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[180px]">Verification weekday</div>
              <div>{displayedWeekday ? weekdayLabels[displayedWeekday] : ''}</div>
            </div>
          )}

          {!isAfterBackup && verificationInterval?.type === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[180px]">Verification day of month</div>
              <div>{displayedDayOfMonth || ''}</div>
            </div>
          )}

          {!isAfterBackup && verificationInterval?.type === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[180px]">Cron expression (UTC)</div>
                <code className="rounded bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700">
                  {verificationInterval?.cronExpression || ''}
                </code>
              </div>
              {verificationInterval?.cronExpression &&
                (() => {
                  try {
                    const interval = CronExpressionParser.parse(
                      verificationInterval.cronExpression,
                      {
                        tz: 'UTC',
                      },
                    );
                    const nextRun = interval.next().toDate();
                    return (
                      <div className="mb-1 flex w-full items-center text-xs text-gray-600 dark:text-gray-400">
                        <div className="min-w-[180px]" />
                        <div>
                          Next run {dayjs(nextRun).local().format(dateTimeFormat.format)}
                          <br />({dayjs(nextRun).fromNow()})
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
            </>
          )}

          {!isAfterBackup &&
            verificationInterval?.type !== IntervalType.HOURLY &&
            verificationInterval?.type !== IntervalType.CRON && (
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[180px]">Verification time of day</div>
                <div>{formattedTime}</div>
              </div>
            )}

          <div className="mt-5 mb-1 flex w-full items-center">
            <div className="min-w-[180px]">Notifications</div>
            <div>
              {config.sendNotificationsOn.length > 0
                ? config.sendNotificationsOn.map((type) => notificationLabels[type]).join(', ')
                : 'None'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
