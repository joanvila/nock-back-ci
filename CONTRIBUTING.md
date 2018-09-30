# Contributing to nock-back-ci

We're glad you want to make a contribution!

If you want to discuss or make a change, start by opening an [issue](https://github.com/joanvila/nock-back-ci/issues). Then fork this repository and in a new branch make your changes. Once it's done, submit your pull request.

Take note of the build status of your pull request, only builds that pass will be accepted. Please also keep to our conventions and style so we can keep this repository nice and clean.

## Working locally

Once you have forked the repo and it is cloned to your local machine run this command:

```
npm install
```

This will install all the dependencies needed.

At this point you can do your changes. You can test them manually using the example test that you can find in the `examples` directory. Feel free to improve the example too.

## Testing

Each contribution must come with it's own tests. In order to run them, use:

```
npm test
```

The testing is being done using:

- [Jest](https://jestjs.io/) as the testing framework.
