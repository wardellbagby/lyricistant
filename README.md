# Lyricistant
![lyricistant](lyricistant.png)

An assistant to the lyricist in you!

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/wardellbagby/lyricistant?style=for-the-badge)](https://lyricistant.app/#download)
[![GitHub Release Date](https://img.shields.io/github/release-date/wardellbagby/lyricistant?style=for-the-badge)](https://lyricistant.app/#download)
[![GitHub](https://img.shields.io/github/license/wardellbagby/lyricistant?style=for-the-badge)](https://github.com/wardellbagby/lyricistant/blob/main/LICENSE.md)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/wardellbagby/lyricistant/Continuous%20Integration?style=for-the-badge)](https://github.com/wardellbagby/lyricistant/actions?query=workflow%3A%22Continuous+Integration%22)

## What is it?

Lyricistant is a writing app geared toward helping you write lyrics, poetry, or anything else you desire!

Unlike other apps with a focus on rhyming, Lyricistant is first and foremost a writing app. It's made for you to use to 
write your lyrics, while offering helpful features to keep you in the writing zone.

Its features include:
- Showing the amount of syllables per line.
- Contextually displaying rhymes as you type or select words.
- Easily saving and reopening lyrics that you've made.
- Drag and Drop support for quickly reopening lyrics.
- _[Desktop Only]_ Remembering your recently opened lyrics to help you continue where you left off.
- Both a light and dark theme that it can automatically switch between.
- Automatically updating.
- Available on your favorite platforms!
  - [Mac](https://lyricistant.app/#download)
  - [Windows](https://lyricistant.app/#download)
  - [Linux](https://lyricistant.app/#download)
  - [And your computer browser!](https://lyricistant.app)
  - _Android / iOS coming soon!_

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
