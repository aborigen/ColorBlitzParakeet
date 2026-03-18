// Bridge for Yandex Games SDK
// We use window.YaGames as defined by the script in layout.tsx

export interface YandexSDK {
  adv: {
    showFullscreenAdv: (callbacks: { onOpen?: () => void; onClose?: (wasShown: boolean) => void; onError?: (error: any) => void }) => void;
    showRewardedVideo: (callbacks: { onOpen?: () => void; onRewarded?: () => void; onClose?: () => void; onError?: (error: any) => void }) => void;
  };
  getLeaderboards: () => Promise<any>;
}

export async function initYandexSDK(): Promise<YandexSDK | null> {
  if (typeof window === 'undefined' || !(window as any).YaGames) return null;
  try {
    const sdk = await (window as any).YaGames.init();
    return sdk;
  } catch (err) {
    console.error('Yandex SDK Init Error:', err);
    return null;
  }
}

export async function showFullscreenAd(sdk: YandexSDK | null) {
  if (!sdk) return;
  return new Promise<void>((resolve) => {
    sdk.adv.showFullscreenAdv({
      onClose: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export async function submitScoreToLeaderboard(sdk: YandexSDK | null, leaderboardName: string, score: number) {
  if (!sdk) return;
  try {
    const lb = await sdk.getLeaderboards();
    await lb.setLeaderboardScore(leaderboardName, score);
  } catch (err) {
    console.error('Leaderboard error:', err);
  }
}
