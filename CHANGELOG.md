# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Follow config file redirections ([T304772]).
- Include `schema` directory in npm package ([T318352]).

## [2.0.0-alpha.2] - 2022-09-22

### Changed

- Update "selection" automatic tests.

### Fixed

- Do not fail on JSON-LD objects with unescaped control characters ([T318336]).

## [2.0.0-alpha.1] - 2022-09-20

### Added

- Add this changelog file.
- Add JSON-LD selection ([T304332]).

### Changed

- Handle step application errors and return empty-array output ([T305163]).

### Fixed

- Reject XPath v3.1 expressions ([T308666]).
- Reject empty-string configurations for Citoid and XPath selection ([T308171]).
- Do not fail on empty or invalid outputs for mandatory fields (in addition to
  marking template as non-applicable), and fix validation pattern for `itemType`
  field ([T311519]).
- URL-normalize paths ([T316257]).
- Correctly identify HTML elements with 'value' attribute ([T311925]).

## [2.0.0-alpha.0] - 2022-08-26

### Added

- Support custom `fetch` to circumvent CORS same-origin restrictions on
  browsers.
- Support creating new tests at specific locations in the tests array.

### Changed

- Remove dependency on Node's `path` for browser support.
- Remove JSDOM dependency for browser support.

### Fixed

- Support fetching metawiki resources from browser.
- Fix XPath selection not working in Firefox ([T316370]).

## [1.0.1] - 2022-08-08

### Fixed

- Fix fastest-levenshtein library import error.

## [1.0.0] - 2022-08-01

### Added

- First version published to npm.


[unreleased]: https://github.com/olivierlacan/keep-a-changelog/compare/v2.0.0-alpha.2...v2
[2.0.0-alpha.2]: https://gitlab.wikimedia.org/diegodlh/w2c-core/-/compare/v2.0.0-alpha.1...v2.0.0-alpha.2
[2.0.0-alpha.1]: https://gitlab.wikimedia.org/diegodlh/w2c-core/-/compare/v2.0.0-alpha.0...v2.0.0-alpha.1
[2.0.0-alpha.0]: https://gitlab.wikimedia.org/diegodlh/w2c-core/-/compare/v1.0.1...v2.0.0-alpha.0
[1.0.1]: https://gitlab.wikimedia.org/diegodlh/w2c-core/-/compare/v1.0.0...v1.0.1
[1.0.0]: https://gitlab.wikimedia.org/diegodlh/w2c-core/-/tags/v1.0.0

[T318352]: https://phabricator.wikimedia.org/T318352
[T318336]: https://phabricator.wikimedia.org/T318336
[T316370]: https://phabricator.wikimedia.org/T316370
[T316257]: https://phabricator.wikimedia.org/T316257
[T311925]: https://phabricator.wikimedia.org/T311925
[T311519]: https://phabricator.wikimedia.org/T311519
[T308666]: https://phabricator.wikimedia.org/T308666
[T308171]: https://phabricator.wikimedia.org/T308171
[T305163]: https://phabricator.wikimedia.org/T305163
[T304772]: https://phabricator.wikimedia.org/T304772
[T304332]: https://phabricator.wikimedia.org/T304332