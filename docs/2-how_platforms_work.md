## Table of Contents

1. [Getting Started](1-getting_started.md)
2. [> **How Platforms Work** <](2-how_platforms_work.md)
3. [How The Renderer Works](3-how_the_renderer_works.md)

# How Lyricistant platforms work

At a high-level, platforms have four main jobs they need to accomplish:

1. Create a `RendererDelegate` and `PlatformDelegate` instance.
2. Create instances of various classes needed by common platform code. (I.e., `Files`, `Buffers`, `Preferences`)
3. Load the common and platform-specific code the platform wants to use.
4. Start the renderer by loading the renderer's index.html file and providing it a `RendererDelegate` and `Logger` to
   the `window` instance the renderer will use.

How platforms accomplish these steps is totally at the discretion of the platform, but all existing platforms follow the
same pattern:

1. Create their own `RendererDelegate` and `PlatformDelegate` based on the platform.
    - Electron uses a thin wrapper around `ipcMain` and `ipcRenderer` to accomplish this.
    - Web (Legacy) and Mobile use `DOMRendererDelegate` and `DOMPlatformDelegate`, which manually keep track of
      listeners that have been set and invoke them when events are sent. All of this happens in a single thread.
    - Web (Modern) uses a similar mechanism to Electron since it also uses a two process system, except that the
      platform code is ran inside a Web Worker instead of Node. See `WebRendererDelegate` and `WebPlatformDelegate` if
      you're curious, but it's not important to know.
2. Create an `AppComponent`, which is a container that understands how to inject dependencies into class constructors.
    - The easiest way to create an `AppComponent` is to use the `registerCommonPlatform` and `registerCommonManagers`
      functions in the `packages/common-platform`
3. Call `register` on all the `Manager`s it cares about; both common ones and the platform-specific ones.
    - Since all platforms have an `AppComponent`, they accomplish this by asking their app component to give them a list
      of managers to be used, and iterating over that list, calling `register` on every `Manager`. to call `register` on
4. Import the `index.html` from `packages/renderer` file and load it into a browser.
    - How the various platforms do this differs pretty wildly, but they all get it done.

## Where are the platforms?

All the _runnable_ platforms live in the [apps](../apps/) directory. Right now, the list of runnable platforms are
Mobile (which handles both Android and iOS), Web, Electron, and a "Screenshotter" platform (which is only used for
generating screenshots of Lyricistant).

We make the distinction between a runnable platform and a non-runnable one as there is
a [Core DOM Platform](../packages/core-dom-platform), which is a mostly complete implementation of a platform but cannot
be run by itself. The Core DOM Platform is used by Mobile and Web to share common functionality, since both of those
platforms run entirely in a browser.

## What is a Manager?

In order to more easily handle talking to the renderer, Lyricistant uses its own concept of a `Manager` to handle
registering for events that the renderer sends, and sending events back to the renderer. The purpose of a manager is to
consolidate related platform code into one stateful class. `Manager` itself is just an interface with a single
method: `register`. However, `Manager`s hold the vast majority of Lyricistant's complexity.

Every manager is a bit different, but in general, whenever `register` is called, they'll start listening to events that
the renderer sends. `Manager`s should focus on a specific "feature", where feature is a poorly defined term but can
generally be thought of as handling certain events that users would expect to be related. For instance,
the `FileManager` handles all things relating to files; opening, saving, and creating new files.

A manager doesn't actually _have_ to listen to the renderer, though. The `Manager` pattern is just as useful for
organizing platform-only logic. In those cases, `register` can be thought of as an extra initialization that's run when
the platform is ready to start up.

An example manager might look like this:

```typescript
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';

class MyManager {
  constructor(
    private rendererDelegate: RendererDelegate,
    private logger: Logger,
  ) {
  }

  public register() {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
  }

  private onRendererReady() {
    this.logger.debug("The Renderer has been loaded!");
    this.rendererDelegate.send('app-title-changed', 'My Platform!');
  }
}
```

## The common platform

As mentioned previously, all platforms includes some base functionality of Lyricistant that is referred to as the "
common platform" in the codebase. The common platform handles things that can be done in a platform-agnostic way, but
that every platform will still need to do.

A good example of this is the `PreferenceManager`, which handles updating the renderer whenever the preferences change.
Since the preferences also include information on the user-selected theme, the `PreferenceManager` also manages updating
the renderer on theme changes.

When the common platform needs to do platform-specific logic (for instance, saving the user's preferences), it delegates
that logic out to the platform via an interface that it expects to have access to. For the `PreferenceManager`, that's
the `Preferences` interface. The `Preferences` interface defines a very basic API; the ability to get and set
preferences. Platforms can implement that in whatever way they choose; for example, Electron saves and loads a JSON file
from disk, while Web and Mobile load from `localStorage`. We refer to the dependencies that the common platform managers
need, like `Preferences` as the common platform dependencies.

With this pattern, we can have the common platform handle much of the tough logic of coordinating with the renderer
without having to duplicate that same logic for multiple platforms. It also makes implementing a new platform much
easier, as now they only need to implement a few interfaces to get much of their needed logic for free.

The common platform lives in [packages/common-platform.](../packages/common-platform)

## The common platform dependencies

Assuming you use `registerCommonPlatform`, you'll be required to pass in a `PlatformDependencies` object. This object
should have function properties that return an object that adheres to a specific interface. That interface depends on
the property in question. For example, the `files` property should return an object that adheres to the `Files`
interface.

That's a confusing blurb, but Typescript makes it difficult to get it wrong, since `PlatformDependencies` is strongly
typed. Here's an example of what using `registerCommonPlatform` looks like:

```typescript
import { registerCommonPlatform } from "./AppComponents";

registerCommonPlatform({
  files: () => {
    return {
      openFile: async (file?) => {
        /* TODO */
      },
      saveFile: async (data, defaultFileName, path) => {
        /* TODO */
      }
    }
  },
  ...
}, component);
```

## Platform specific code

Most platforms need to tweak Lyricistant a bit in order to better fit the platform's abilities. For instance, Android
needs to handle physical back buttons, and Electron has to handle the app being started via double-clicking on
a `.lyrics` file.

There are no wrong ways to do this, so long as the code stays in your platform's directory, but most instances opt to
create a new `Manager` in their platform directory and register it along with the common managers. A good example of
this is the `BackButtonManager` in the mobile app.

---

### [Next, let's talk more about how the renderer works!](3-how_the_renderer_works.md)
