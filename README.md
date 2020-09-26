# Lyricistant
![lyricistant](lyricistant.png)

An assistant to the lyricist in you!

## What is it?

Lyricistant is a text application that lyricists can use to write their lyrics. It offers these features that lyricists will find helpful:

- The syllable count for every written line.
- An automatic rhyming dictionary that will show rhymes for selected words.
- The ability to save and open lyrics.
- Recently opened lyrics.

## How do I use it?

- [On the Web!](https://lyricistant.app)  
- [On your computer!](https://github.com/wardellbagby/lyricistant/releases/latest)


## Information for developers
### Getting Started

```bash
git checkout https://github.com/wardellbagby/lyricistant.git
cd lyricistant
npm install
# Starts the Electron app.
npm run start-app
# Starts the Web app.
npm run start-web
```


### Viewing the latest on `main`

New commits to `main` are automatically deployed, both on the web and as native binaries.

- [Web](https://dev.lyricistant.app)  
- [Native binaries](https://github.com/wardellbagby/lyricistant/releases/tag/latest)
### Running Tests
There are currently unit and UI tests in the project.

In order to run tests, you'll need to build the test versions of the platforms. You can do that via:

```bash
npm run build-test-app && npm run dist-test-app # builds Electron test app.
npm run build-test-web # builds Web test sources.
```

You can then run the tests via:

```bash
npm run test
```

If you want to attach a debugger to the tests, you can run this:

```bash
npm run test -- --inspect-brk=5225
```

The test will then wait until you attach a NodeJS debugger on port `5225`.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE.md) file for details

[![forthebadge](https://forthebadge.com/images/badges/built-with-grammas-recipe.svg)](https://forthebadge.com)
