## Table of Contents

- [Getting Started](1-getting_started.md)
- [**How Platforms Work**](2-how_platforms_work.md)
- [How The Renderer Works](3-how_the_renderer_works.md)

# How Lyricistant platforms work

At a high-level, platforms have four main jobs they need to accomplish:

1. Create a `RendererDelegate` and `PlatformDelegate` instance.
2. Create instances of various classes needed by common platform code. (I.e., `Files`, `Buffers`, `Preferences`)
3. Load the common and platform-specific code the platform wants to use.
4. Start the renderer by loading the renderer's index.html file and providing it a `RendererDelegate` to the `window` instance the renderer will use.

How platforms accomplish these steps is totally at the discretion of the platform, but all existing platforms follow the same pattern:

1. Create their own `RendererDelegate` and `PlatformDelegate` based on the platform.
   - Electron uses a thin wrapper around `ipcMain` and `ipcRenderer` to accomplish this.
   - Web (Legacy) and Mobile use `CoreRendererDelegate` and `CorePlatformDelegate`, which manually keep track of listeners that have been set and invoke them when events are sent. All of this happens in a single thread.
   - Web (Modern) uses a similar mechanism to Web (Legacy) but sends messages to a Web Worker and back to the renderer.
2. Create an `AppComponent`, which is a container that understands how to inject dependencies into class constructors.
   - The easiest way to create an `AppComponent` is to use the `registerCommonPlatform` and `getCommonManagers` functions in the `packages/common-platform`
3. Call `register` on all the `Manager`s it cares about; both common ones and the platform-specific ones.
   - Since all platforms have an `AppComponent`, they accomplish this by asking their app component to give them a list of managers to be used, and iterating over that list to call `register` on
4. Import the `index.html` from `packages/renderer` file and load it into a browser.
   - How the various platforms do this differs pretty wildly, but they all get it done.


## What is a Manager?

In order to more easily handle talking to the renderer, Lyricistant uses its own concept of a `Manager` to handle registering for events that the renderer sends and to send events back to the renderer. The purpose of a manager is to consolidate related platform code into one stateful class. `Manager` itself is just an interface with a single method: `register`. However, `Manager`s hold the vast majority of Lyricistant's complexity.

Every manager is a bit different, but in general, whenever `register` is called, they'll start listening to events that the renderer sends. `Manager`s should focus on a specific "feature", where feature is poorly defined term but can generally be thought of as things that users would expect to related in functionality. For instance, the `FileManager` handles all things relating to files; opening, saving, and creating new files.

A manager doesn't actually _have_ to listen to the renderer, though. The `Manager` pattern is just as useful for organizing platform-only logic.
## The common platform

As mentioned previously, all platforms includes some base functionality of Lyricistant that is referred to as the "common platform" in the codebase. The common platform handles things that can be done in a platform-agnostic way, but that every platform will still need to do.

A good example of this is the `PreferenceManager`, which handles updating the renderer whenever the preferences change. Since the preferences also include information on the user-selected theme, the `PreferenceManager` also manages updating the renderer on theme changes.

When the common platform needs to do platform-specific logic (for instance, saving the user's preferences), it delegates that logic out to the platform via an interface that it expects to have access to. For the `PreferenceManager`, that's the `Preferences` interface. The `Preferences` interface defines a very basic API; the ability to get and set preferences. Platforms can implement that in whatever way they choose; for example, Electron saves and loads a JSON file from disk, while Web and Mobile load from `localStorage`.

With this pattern, we can have the common platform handle much of the tough logic of coordinating with the renderer without having to duplicate that same logic for multiple platforms. It also makes implementing a new platform much easier, as now they only need to implement a few interfaces to get much of their needed logic for free.

## Platform specific code

Most platforms need to tweak Lyricistant a bit in order to better fit the platform's abilities. For instance, Android needs to handle physical back buttons, and Electron has to handle the app being started via double-clicking on a `.lyrics` file.

There are no wrong ways to do this, so long as the code stays in your platform directory, but most instances opt to create a new `Manager` in their platform directory and register it along with the common managers. A good example of this is the `BackButtonManager` in the mobile app.

---

### [Next, let's talk more about how the renderer works!](3-how_the_renderer_works.md)