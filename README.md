# nock-back-ci

A simple acceptance testing helper optimised for complex CI problems

## Motivation

As responsible developers we want to test our NodeJS service with acceptance tests to simulate real traffic.

In a continuous deployment environment, the CI pipeline should be able to run those acceptance tests,
however, the deployment of our service shouldn’t depend on an external service being up and running.

To this, we also need to add the fact that often, our service relies on a secrets provider service that
is not available from the CI pipeline.

