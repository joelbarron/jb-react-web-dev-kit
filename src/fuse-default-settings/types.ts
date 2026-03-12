import type { Palette } from '@mui/material/styles';

export type PartialDeep<T> = T extends (...args: never[]) => unknown
	? T
	: T extends Array<infer U>
		? Array<PartialDeep<U>>
		: T extends object
			? { [K in keyof T]?: PartialDeep<T[K]> }
			: T;

export type FuseLayoutDefaultsProps = Record<string, unknown>;

export type FuseThemeType = { palette: PartialDeep<Palette> };

export type FuseSettingsConfigType = {
	layout: { style?: string; config?: PartialDeep<FuseLayoutDefaultsProps> };
	customScrollbars?: boolean;
	direction: 'rtl' | 'ltr';
	theme: { main: FuseThemeType; navbar: FuseThemeType; toolbar: FuseThemeType; footer: FuseThemeType };
	defaultAuth?: string[];
	loginRedirectUrl: string;
};
