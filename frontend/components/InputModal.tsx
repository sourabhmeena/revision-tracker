"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { CheckIcon } from "./icons";

interface InputModalProps {
  title: string;
  message: string;
  inputType?: "text" | "number";
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export default function InputModal({
  title,
  message,
  inputType = "text",
  defaultValue = "",
  placeholder = "",
  submitLabel = "Submit",
  onSubmit,
  onCancel,
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
  };

  return (
    <ModalShell onClose={onCancel} labelledBy="input-title">
      <h3 id="input-title" className="rs-title text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4">{message}</p>
      <input
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder}
        className="rs-input mb-4"
        autoFocus
        min={inputType === "number" ? 1 : undefined}
      />
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="rs-btn rs-btn-outline">Cancel</button>
        <button onClick={handleSubmit} className="rs-btn rs-btn-primary"><CheckIcon /> {submitLabel}</button>
      </div>
    </ModalShell>
  );
}
