import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const SHADCN_REFRESH_SAFE_EXPORTS = [
	"badgeVariants",
	"buttonGroupVariants",
	"buttonVariants",
	"navigationMenuTriggerStyle",
	"toggleVariants",
	"useFormField",
	"useSidebar",
];

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		rules: {
			// Preserve standard shadcn public imports; these helpers have no component state.
			"react-refresh/only-export-components": [
				"error",
				{ allowExportNames: SHADCN_REFRESH_SAFE_EXPORTS },
			],
		},
	},
]);
