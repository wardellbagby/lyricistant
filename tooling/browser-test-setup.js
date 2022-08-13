const { configure } = require('playwright-testing-library');

configure({
  // Use a longer timeout for the findBy queries on CI since, ya know, it's slow.
  asyncUtilTimeout: process.env.CI ? 10_000 : 1_000,
});
