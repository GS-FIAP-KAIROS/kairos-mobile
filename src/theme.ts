// Design tokens do KAIROS — preto, papel e o amarelo da marca.
export const palette = {
  sol: '#FFD230',      // amarelo KAIROS (mesmo das docs e do video 3D)
  solSoft: '#FFF3C2',
  urgente: '#E5383B',
  atencao: '#F48C06',
  ok: '#1F9D55',
  okSoft: '#DDF3E6',
};

export type Theme = {
  dark: boolean;
  bg: string; surface: string; surfaceAlt: string; line: string;
  ink: string; inkSoft: string; inkMute: string;
  pill: string; pillInk: string;
};

export const light: Theme = {
  dark: false,
  bg: '#F6F6F4', surface: '#FFFFFF', surfaceAlt: '#EFEFEC', line: '#E3E3DE',
  ink: '#16161A', inkSoft: '#4A4A52', inkMute: '#8C8C94',
  pill: '#16161A', pillInk: '#FFFFFF',
};

export const dark: Theme = {
  dark: true,
  bg: '#0E0E12', surface: '#1A1A20', surfaceAlt: '#24242B', line: '#2E2E36',
  ink: '#F4F4F2', inkSoft: '#C4C4CA', inkMute: '#8A8A93',
  pill: '#F4F4F2', pillInk: '#16161A',
};

export const font = {
  display: 'BricolageGrotesque_700Bold',
  displayMed: 'BricolageGrotesque_600SemiBold',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodyBold: 'Inter_600SemiBold',
};

export const radius = { sm: 10, md: 16, lg: 24, xl: 32 };

export function corUrgencia(u: number) {
  return u >= 4 ? palette.urgente : u >= 3 ? palette.atencao : palette.ok;
}
