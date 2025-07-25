interface BarLogoOptions {
  barName?: string;
  size?: 'small' | 'medium' | 'large';
}

export const useBarLogo = ({ barName, size = 'medium' }: BarLogoOptions) => {
  const isOrdinario =
    barName?.toLowerCase().includes('ordinário') ||
    barName?.toLowerCase().includes('ordinario');

  const getLogoSize = () => {
    switch (size) {
      case 'small':
        return '/favicons/ordinario/favicon-32x32.png';
      case 'medium':
        return '/favicons/ordinario/android-chrome-192x192.png';
      case 'large':
        return '/favicons/ordinario/android-chrome-512x512.png';
      default:
        return '/favicons/ordinario/android-chrome-192x192.png';
    }
  };

  const logoUrl = isOrdinario ? getLogoSize() : null;
  const shouldUseLogo = isOrdinario && logoUrl;

  return {
    logoUrl,
    shouldUseLogo,
    isOrdinario,
  };
};
