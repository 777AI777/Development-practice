"use client";

import { useEffect, useRef, useState } from "react";

import {
  DISPLAY_USER_ID_MIN_LENGTH,
  isValidDisplayUserId,
  normalizeDisplayUserId,
} from "@/lib/user-utils";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

interface UseDisplayUserIdCheckResult {
  status: AvailabilityStatus;
}

const DEBOUNCE_MS = 500;

export function useDisplayUserIdCheck(value: string): UseDisplayUserIdCheckResult {
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const normalized = normalizeDisplayUserId(value);

    if (!normalized || normalized.length < DISPLAY_USER_ID_MIN_LENGTH) {
      setStatus("idle");
      return;
    }

    if (!isValidDisplayUserId(normalized)) {
      setStatus("idle");
      return;
    }

    setStatus("checking");

    const timer = setTimeout(() => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const encoded = encodeURIComponent(normalized);

      fetch(`/api/v1/users/check-availability?displayUserId=${encoded}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json() as Promise<{ data: { available: boolean } }>;
        })
        .then(({ data }) => {
          if (!controller.signal.aborted) {
            setStatus(data.available ? "available" : "taken");
          }
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            return;
          }
          if (!controller.signal.aborted) {
            setStatus("error");
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, [value]);

  return { status };
}
