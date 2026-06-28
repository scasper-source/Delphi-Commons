/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { RiskLevel } from "./types";

export type Notification = {
  id: string;
  risk: RiskLevel;
  title: string;
  message: string;
};

type NotificationContextValue = {
  notifications: Notification[];
  notify: (risk: RiskLevel, title: string, message: string) => void;
  dismiss: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

let nextId = 1;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (risk: RiskLevel, title: string, message: string) => {
      const id = `notif-${nextId++}`;
      setNotifications((current) => [...current, { id, risk, title, message }]);
      const duration = risk === "danger" ? 8000 : 5000;
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotify() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotify must be used within a NotificationProvider");
  return context.notify;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
}

export function ToastContainer() {
  const { notifications, dismiss } = useNotifications();
  if (notifications.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {notifications.map((n) => (
        <div key={n.id} className={`toast toast-${n.risk}`} role={n.risk === "danger" ? "alert" : "status"}>
          <div className="toast-body">
            <strong>{n.title}</strong>
            <span>{n.message}</span>
          </div>
          <button className="toast-dismiss" onClick={() => dismiss(n.id)} type="button" aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
