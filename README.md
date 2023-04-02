![lyricistant_logo](apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png)
# Lyricistant

![lyricistant](lyricistant.png)

An assistant to the lyricist in you!

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/wardellbagby/lyricistant?style=for-the-badge)](https://lyricistant.app/#download)
[![GitHub Release Date](https://img.shields.io/github/release-date/wardellbagby/lyricistant?style=for-the-badge)](https://lyricistant.app/#download)
[![GitHub](https://img.shields.io/github/license/wardellbagby/lyricistant?style=for-the-badge)](https://github.com/wardellbagby/lyricistant/blob/main/LICENSE.md)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/wardellbagby/lyricistant/Continuous-Integration.yml?branch=main&style=for-the-badge)](https://github.com/wardellbagby/lyricistant/actions/workflows/Continuous-Integration.yml)

## What is it?

Lyricistant is a writing app geared toward helping you write lyrics, poetry, or anything else you desire!

Unlike other apps with a focus on rhyming, Lyricistant is first and foremost a writing app. It's made for you to use to
write your lyrics, while offering helpful features to keep you in the writing zone.

Its features include:

- Showing the amount of syllables per line.
- Contextually displaying rhymes as you type or select words.
- Allowing easy lookups of definitions for words, with support for synonyms and antonyms.
- Easily saving and reopening lyrics that you've made.
- Showing you the history of your file.
- _[Desktop and Web]_ Drag and Drop support for quickly reopening lyrics.
- _[Desktop only]_ Remembering your recently opened lyrics to help you continue where you left off.
- Both a light and dark theme that it can automatically switch between.
- Automatically updating!
- _[Android 12+ only]_ Matching your device's theme colors to effortlessly match Material You.
- Available on your favorite platforms!
  - [Mac](https://lyricistant.app/#download)
  - [Windows](https://lyricistant.app/#download)
  - [Linux](https://lyricistant.app/#download)
  - [Web](https://lyricistant.app)
  - [Android](https://play.google.com/store/apps/details?id=com.wardellbagby.lyricistant)
  - [iOS](https://apps.apple.com/om/app/lyricistant/id1561506174)

## How can I use it?

#### [Browse it in your browser!](https://lyricistant.app)

#### [Check it out on your computer!](https://lyricistant.app/#download)

#### [Install it on your iPhone or iPad!](https://apps.apple.com/om/app/lyricistant/id1561506174)

#### [Activate it on your Android device!](https://play.google.com/store/apps/details?id=com.wardellbagby.lyricistant)

## What's up with the name?

It's a combination of two words:

- Lyricist
- Assistant

Lyricistant!

## Information for developers

### Documentation

It's a little outdated, but
here's [a blog post](https://dev.to/wardellbagby/the-architecture-of-an-electron-app-ported-to-web-399e) giving a
high-level overview of Lyricistant.

The most up-to-date [documentation is here](docs/1-getting_started.md)

### Building Lyricistant

This project uses [Gulp](https://gulpjs.com/) to build.

The easiest way to use Gulp is via installing Gulp globally via `npm install -g gulp`, but this isn't required as `Gulp`
is included as a dev dependency for this project, and so doing `npm install; node_modules/.bin/gulp <task>` will also
work.

How to check out and run the project:

```shell
git checkout https://github.com/wardellbagby/lyricistant.git
cd lyricistant
# Starts the Electron app for development.
gulp startElectron
# Starts the Web app for development.
gulp startWeb
# Starts the Android app for development.
gulp startAndroid
# Starts the iOS app for development.
gulp startIOS
```

If you use a Jetbrains IDE (WebStorm, IntelliJ IDEA, etc) or Visual Studio Code, you can build and attach a debugger for
all of these tasks natively in the IDE (via either Run Configurations for Jetbrains products or Run & Debug for Visual
Studio Code).

### Viewing the latest on `main`

New commits to `main` are automatically deployed, both on the web and as native binaries.

- [Web](https://dev.lyricistant.app)
- [Native binaries](https://github.com/wardellbagby/lyricistant/releases/tag/latest)

### Running Tests

There are currently unit and UI tests in the project.

You can run all tests in a terminal via:

```shell
gulp testAll
# To allow attaching a debugger
node --inspect-brk ./node_modules/.bin/gulp testAll
```

There are various other test tasks that are named after the folder the tests are contained in. You can print a list of
all test tasks by running:

```
gulp --tasks-simple | grep "test"
```

If you're using VS Code or a Jetbrains IDE, you can also see the test tasks in your Run/Debug or Run Configurations,
respectively.

You can also run tests natively in your IDE using Jest, which will make it even easier to attach a debugger, as your IDE
will do that for you.

It's preferred to use the various `gulp` tasks to invoke tests, as they will handle any necessary prerequisites,
such as building the app before running the tests. However, feel free to use Jest on the command line or in your IDE for
better iteration, but make sure to also run the test via Gulp to verify that it works correctly!

#### UI Tests

When running the UI tests (`gulp testWeb` and `gulp testElectron`), you can set the environment variable `PWDEBUG` to
`1` in order to open the Playwright Debugger and run the tests visibly.

E.g.,

```shell
PWDEBUG=1 gulp testWeb
```

This also works with Jest:

```shell
PWDEBUG=1 jest --projects apps/web/test
```

### Updating dependencies

There's a helper script at `scripts/install-latest.ts` that can be used to update all dependencies in the project that
start with a specific string to a specified version.

This is very useful for updating any scoped NPM dependencies that should be updated in lockstep (i.e., `@codemirror`).

Example usage:

```shell
./scripts/install-latest.ts @codemirror 0.19.0 # omit to update to latest
```

### Committing

This project uses [Commitzen](https://github.com/commitizen/cz-cli) and [Commitlint](https://commitlint.js.org/#/) to
enforce a single commit style.

To create a commit using an interactive wizard that follows the commit standards, run `git cz`

## Code of Conduct

We aim to be an inclusive and welcoming community. To make that explicit, we have
a [code of conduct](CODE_OF_CONDUCT.md) that applies to this project.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE.md) file for details

[![forthebadge](https://forthebadge.com/images/badges/built-with-grammas-recipe.svg)](https://forthebadge.com)
