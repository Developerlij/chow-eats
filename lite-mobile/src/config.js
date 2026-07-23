// Central configuration for Chow Lite features
export const IS_LITE_MODE = typeof process !== 'undefined' && 
                            process.env && 
                            process.env.EXPO_PUBLIC_LITE_MODE === 'true';
