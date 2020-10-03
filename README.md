# Lyricistant
![lyricistant](lyricistant.png)

An assistant to the lyricist in you!

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/wardellbagby/lyricistant?style=for-the-badge)](https://lyricistant.app/#download)
[![GitHub Release Date](https://img.shields.io/github/release-date/wardellbagby/lyricistant?style=for-the-badge)](https://lyricistant.app/#download)
[![GitHub](https://img.shields.io/github/license/wardellbagby/lyricistant?style=for-the-badge)](https://github.com/wardellbagby/lyricistant/blob/main/LICENSE.md)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/wardellbagby/lyricistant/Continuous%20Integration?style=for-the-badge)](https://github.com/wardellbagby/lyricistant/actions?query=workflow%3A%22Continuous+Integration%22)

## What is it?

Lyricistant is a writing app geared toward helping you write lyrics, poetry, or anything else you desire!

- Shows the amount of syllables in every line!
- Automatically shows you rhymes as you types!
- Easily save and re-open lyrics that you've created!
- [Desktop Only] Tracks your recently opened lyrics for easy reference!
- Light and dark theme compatible, and follows your system theme!
- Can be used on Mac, Windows, Linux, and your Desktop browser! 

## How can I use it?

#### [Check it out in your browser now!](https://lyricistant.app)  
#### [Download it to your computer!](https://lyricistant.app/#download)

## What's up with the name?

It's a combination of two words:

- Lyricist
- Assistant

Lyricistant!


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
npm run test -- --inspect-brk=5225 # The extra -- is not a typo!
```

The test will then wait until you attach a NodeJS debugger on port `5225`.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE.md) file for details

[![forthebadge](https://forthebadge.com/images/badges/built-with-grammas-recipe.svg)](https://forthebadge.com)
