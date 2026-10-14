'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Liff } from '@line/liff';

export interface LiffUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export function useLiff() {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [profile, setProfile] = useState<LiffUserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  const initLiff = useCallback(async () => {
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      // If no valid LIFF ID provided (e.g. testing locally or initial scaffold)
      if (!liffId || liffId === 'your_line_liff_id_here' || liffId === 'test_line_liff_id') {
        console.warn('[LIFF] NEXT_PUBLIC_LIFF_ID is not configured or in test mode. Enabling Dev Preview mode.');
        setIsMockMode(true);
        // Default preview user
        setProfile({
          userId: 'mock_line_user_001',
          displayName: 'Demo User (Preview)',
          pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          statusMessage: 'ทดสอบระบบบันทึกรายรับ-รายจ่าย',
        });
        setIsLoggedIn(true);
        setIsReady(true);
        return;
      }

      // Dynamically import @line/liff for client-side execution
      const liffModule = (await import('@line/liff')).default;
      await liffModule.init({ liffId });

      setLiffObject(liffModule);
      setIsInClient(liffModule.isInClient());

      if (liffModule.isLoggedIn()) {
        setIsLoggedIn(true);
        const userProfile = await liffModule.getProfile();
        setProfile({
          userId: userProfile.userId,
          displayName: userProfile.displayName,
          pictureUrl: userProfile.pictureUrl,
          statusMessage: userProfile.statusMessage,
        });
      } else {
        setIsLoggedIn(false);
        // If inside LINE in-app browser, automatically trigger login
        if (liffModule.isInClient()) {
          liffModule.login();
        }
      }

      setIsReady(true);
    } catch (err: unknown) {
      console.error('[LIFF] Initialization error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to initialize LIFF';
      setError(errMsg);
      // Fallback to dev mode so dashboard can still be previewed
      setIsMockMode(true);
      setProfile({
        userId: 'preview_user_dev',
        displayName: 'Guest / Dev Preview',
      });
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    initLiff();
  }, [initLiff]);

  const login = () => {
    if (liffObject && !liffObject.isLoggedIn()) {
      liffObject.login();
    }
  };

  const logout = () => {
    if (liffObject && liffObject.isLoggedIn()) {
      liffObject.logout();
      setIsLoggedIn(false);
      setProfile(null);
      window.location.reload();
    }
  };

  const setCustomUserId = (customId: string, customName?: string) => {
    setIsMockMode(true);
    setProfile({
      userId: customId,
      displayName: customName || `User (${customId.slice(0, 6)})`,
    });
  };

  return {
    liff: liffObject,
    profile,
    isReady,
    isLoggedIn,
    isInClient,
    error,
    isMockMode,
    login,
    logout,
    setCustomUserId,
  };
}
