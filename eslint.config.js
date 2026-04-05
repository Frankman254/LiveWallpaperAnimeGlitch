import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ESLint 9+ flat config.
 * Prettier: solo formato (.prettierrc). eslint-config-prettier va al final y desactiva
 * reglas de ESLint que chocan con el formateo de Prettier.
 */
export default tseslint.config(
	{
		ignores: ['dist/**', 'node_modules/**', 'build/**', 'coverage/**']
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				ecmaFeatures: { jsx: true }
			}
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true }
			]
		}
	},
	eslintConfigPrettier
);
