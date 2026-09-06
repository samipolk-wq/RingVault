# Regression tests

Run `npm test` after installing dependencies. These tests exercise the server routes with mocked authentication, database, and Stripe clients. They do not contact live services or charge cards.

Also run `npm run build` before release. A successful build does not replace a deployed checkout and webhook test.
