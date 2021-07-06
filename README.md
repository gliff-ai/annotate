# [gliff.ai](https://gliff.ai) ANNOTATE

This repository contains the Open Source code for [gliff.ai](https://gliff.ai)'s ANNOTATE user interface.
This user interface is just one part of [gliff.ai](https://gliff.ai)'s growing MLOps platform.
ANNOTATE allows domain experts to annotate multidimensional images for developing imaging AI products.
When used as part of [gliff.ai](https://gliff.ai)'s full platform ANNOTATE provides just one step in developing production-quality imaging AI whilst satisfying any relevant regulatory frameworks.

User documentation will be available soon.

Technical documentation will be available soon.

A preview build of the current `main` branch is [here](https://annotate.staging.gliff.app/)

## Development

Frontend code should be written in [Typescript](https://www.typescriptlang.org/) and transpiled using the options in `tsconfig.json`.
NPM should be used for package management.

`npm run serve` will run a local webpack developer server for quick access.

Please follow [gliff.ai](https://gliff.ai)'s Community Guidelines when contributing to this codebase.

## Linting and formatting

Code should be linted with [ESLint](https://eslint.org/) using `.eslintrc.js` and formatted with [Prettier](https://prettier.io/).
HTML + CSS, mark-up and mark-down should all be formatted using prettier.

`npm run lint` will lint the codebase.

Our GitHub Actions will also lint any pull requests before they're merged.

## Testing

Code should be tested using [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

`npm run test` will run any existing tests in our codebase.

Our GitHub Actions will also test any pull requests before they're merged.

## Continuous integration

GitHub Actions should be included under `.github/workflows`.

## License

This code is licensed under a GNU AGPLv3 license. Our reasons for this are available [here](https://gliff.ai/articles/why-gnu-agplv3/)
