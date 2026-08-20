import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      /**
       * Downgraded from error to warning.
       *
       * React's own guidance calls this "not recommended" rather than wrong,
       * and the places we do it are the cases it does not cover: resetting a
       * dialog when it opens, closing the mobile menu on navigation, kicking
       * off a fetch when its inputs change, and re-syncing a media query after
       * mount. Each is a deliberate synchronisation with something outside
       * React, each is guarded so it cannot loop, and the alternatives (remount
       * keys, a fetching library) would be a heavier change than the warning is
       * worth. Kept as a warning so genuinely careless cases still surface.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
