"use client";

import ModalShell from "./ModalShell";
import { TrashIcon, InfoIcon } from "./icons";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const danger = variant === "danger";
  return (
    <ModalShell onClose={onCancel} labelledBy="confirm-title">
      <div className="flex items-start gap-3.5">
        <span
          className={`grid place-items-center w-11 h-11 rounded-2xl text-xl shrink-0 ${
            danger ? "bg-rose-500/12 text-rose-600 dark:text-rose-400" : "bg-primary-soft text-primary"
          }`}
        >
          {danger ? <TrashIcon /> : <InfoIcon />}
        </span>
        <div className="min-w-0">
          <h3 id="confirm-title" className="rs-title text-lg">{title}</h3>
          <p className="text-sm text-muted mt-1">{message}</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end mt-6">
        <button onClick={onCancel} className="rs-btn rs-btn-outline">{cancelLabel}</button>
        <button
          onClick={onConfirm}
          className={`rs-btn text-white ${danger ? "bg-rose-600 hover:bg-rose-700 shadow-[0_12px_28px_-8px_rgba(225,29,72,0.5)]" : "rs-btn-primary"}`}
        >
          {danger && <TrashIcon />} {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
