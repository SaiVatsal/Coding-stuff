import { ExclamationCircleOutlined } from '@ant-design/icons';

export function EditLocalStorageComponent() {
  return (
    <>
      <div className="max-w-[360px] text-yellow-600 dark:text-yellow-400">
        <ExclamationCircleOutlined /> Be careful: with local storage you may run out of ROM memory.
        It is recommended to use S3 or unlimited storages
      </div>

      <div className="mb-5" />
    </>
  );
}
