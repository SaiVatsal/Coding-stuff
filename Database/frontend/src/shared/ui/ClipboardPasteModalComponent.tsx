import { Button, Input, Modal } from 'antd';
import { useState } from 'react';

interface Props {
  open: boolean;
  onSubmit(text: string): void;
  onCancel(): void;
}

export function ClipboardPasteModalComponent({ open, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    onSubmit(trimmed);
    setValue('');
  };

  const handleCancel = () => {
    setValue('');
    onCancel();
  };

  return (
    <Modal
      title="Paste from clipboard"
      open={open}
      onCancel={handleCancel}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" disabled={!value.trim()} onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      }
    >
      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
        Automatic clipboard access is not available. Please paste your content below.
      </p>
      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste your connection string here..."
        rows={4}
        autoFocus
      />
    </Modal>
  );
}
