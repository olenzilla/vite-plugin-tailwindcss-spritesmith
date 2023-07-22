[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# npm-package-template

A template repo for forking to create new standalone npm package repos.

## Basic Usage

1. Fork this.
2. Find-replace-all with what the package name is to what your package name will be.
3. Create and add the `NPM_TOKEN` as a secret to your repo. ([semantic-release authentication for plugins documentation](https://github.com/semantic-release/semantic-release/blob/19e3963acc3a0cc8f4215af29bb30ad57654927e/docs/usage/ci-configuration.md#authentication-for-plugins))
4. Write your code!
5. If there are any new entry-points in addition to `src/index.ts`, add them to `tsconfig.base.json`.
6. If there are any new files meant to be `import`-able in addition to the `src/index.ts`, add them to the `exports` property in `package.json`.
7. (And don't forget to update the README.md :)
