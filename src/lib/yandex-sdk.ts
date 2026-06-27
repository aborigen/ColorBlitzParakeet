// Bridge for Yandex Games SDK
// We use window.YaGames as defined by the script in layout.tsx

export interface YandexSDK {
  adv: {
    showFullscreenAdv: (callbacks: { 
      onOpen?: () => void; 
      onClose?: (wasShown: boolean) => void; 
      onError?: (error: any) => void;
      onOffline?: () => void;
    }) => void;
    showRewardedVideo: (callbacks: { 
      onOpen?: () => void; 
      onRewarded?: () => void; 
      onClose?: () => void; 
      onError?: (error: any) => void; 
    }) => void;
  };
  getLeaderboards: () => Promise<{
    setLeaderboardScore: (name: string, score: number) => Promise<void>;
    getLeaderboardDescription: (name: string) => Promise<any>;
  }>;
  getRemoteConfig: (options?: { clientParams?: Record<string, string> }) => Promise<Record<string, any>>;
  environment: {
    i18n: {
      lang: string;
    };
  };
}

/**
 * Initializes the Yandex SDK with a retry mechanism to account for async script loading.
 */
export async function initYandexSDK(): Promise<YandexSDK | null> {
  if (typeof window === 'undefined') return null;

  const checkSDK = async (retries = 5): Promise<YandexSDK | null> => {
    if ((window as any).YaGames) {
      try {
        const sdk = await (window as any).YaGames.init();
        console.log('Yandex SDK initialized successfully');
        return sdk;
      } catch (err) {
        console.error('Yandex SDK Init Error:', err);
        return null;
      }
    }

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return checkSDK(retries - 1);
    }

    console.warn('Yandex SDK (YaGames) not found after retries');
    return null;
  };

  return checkSDK();
}

/**
 * Shows a full-screen advertisement.
 */
export async function showFullscreenAd(sdk: YandexSDK | null) {
  if (!sdk) return;
  return new Promise<void>((resolve) => {
    sdk.adv.showFullscreenAdv({
      onClose: (wasShown) => {
        console.log('Ad closed, wasShown:', wasShown);
        resolve();
      },
      onError: (err) => {
        console.error('Ad error:', err);
        resolve();
      },
      onOffline: () => {
        console.log('Ad skipped: offline');
        resolve();
      }
    });
  });
}

/**
 * Safely submits a score to a specified leaderboard.
 */
export async function submitScoreToLeaderboard(sdk: YandexSDK | null, leaderboardName: string, score: number) {
  if (!sdk) return;
  try {
    const lb = await sdk.getLeaderboards();
    await lb.setLeaderboardScore(leaderboardName, score);
    console.log(`Score ${score} submitted to ${leaderboardName}`);
  } catch (err) {
    console.warn('Leaderboard submission failed:', err);
  }
}

/**
 * Fetches remote configuration from Yandex Games Console.
 */
export async function fetchRemoteConfig(sdk: YandexSDK | null): Promise<Record<string, any>> {
  if (!sdk) return {};
  try {
    const config = await sdk.getRemoteConfig();
    console.log('Remote Config loaded:', config);
    return config;
  } catch (err) {
    console.warn('Failed to fetch remote config:', err);
    return {};
  }
}

/**
 * Detects the user's language from the SDK environment.
 */
export function getLanguage(sdk: YandexSDK | null): 'en' | 'ru' {
  if (!sdk) return 'en';
  const lang = sdk.environment.i18n.lang;
  return lang.startsWith('ru') ? 'ru' : 'en';
}
