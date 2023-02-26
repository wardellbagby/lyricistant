## Table of Contents

1. [Getting Started](1-getting_started.md)
2. [How Platforms Work](2-how_platforms_work.md)
3. [> **How The Renderer Works** <](3-how_the_renderer_works.md)

# How the Lyricistant renderer works

The "renderer" for Lyricistant is a React app that runs in a browser. Its main job is to provide a UI users can interact
with to type their text, change their settings, open and save files, and more.

The renderer is comparatively much simpler than the various platforms, since platforms do the majority of the
heavy-lifting. If you have React experience, you should hopefully be pretty comfortable exploring here without much
guidance. If you aren't, please let me know, and I'll update the documentation to be clearer!

The renderer code lives in [packages/renderer](../packages/renderer).

## Communicating with the platform

When the renderer is first loaded, its platform will provide a `platformDelegate` and a `logger` to the
renderer's `window`. The `platformDelegate` is an object that can used to send data to and receive data from the current
platform.

There are two existing React hooks to help retrieve data from the platform: `useChannel` and `useChannelData`. Here's
how using those hooks look like:

```typescript jsx
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';

const MyComponent = () => {
  // Useful for channels that don't send data or when your listener should only run on new data. 
  const newAppTitle = useChannel('app-title-changed', () => {
    window.logger.debug('The app title has changed!');
  });
  // Useful for when you want to use the data from a channel to render. Make sure to handle the initial case of it 
  // returning an empty array!
  const [uiConfig] = useChannelData('ui-config');

  // Useful for when you need complete control over platform communication, but prefer useChannel or useChannelData.
  useEffect(() => {
    const listener = () => {
      window.logger.debug('New file created!');
    }
    window.platformDelegate.on('new-file-created', listener);
    return () => {
      window.platformDelegate.removeListener('new-file-created', listener);
    }
  }, []);

  return <div>Can current platform open files? {uiConfig?.open ? 'Yes!' : 'No. :('}</div>
}
```

## Avoiding platform checks

As mentioned before, the renderer is completely platform-agnostic. At no point should it ever know with certainty what
platform its running on. However, it IS allowed to do browser checks to work around UI quirks in different browsers, but
it isn't allowed to use browser checks to gate functionality.

If you find yourself needing to gate functionality based on the platform, instead extend
the [`UiConfig`](../packages/common/main/ui/UiConfig.ts) with a new property and change all platforms to provide a value
for your new property.

## The small layout

Since Lyricistant also supports Mobile, it has two layouts: its desktop (default) layout, and a "small" layout that
works better on smaller devices. When adding new UI, it's important to make sure it looks good on both the default
layout and the small layout. To make these checks easier, there's
a [`useSmallLayout`](../packages/renderer/main/app/useSmallLayout.ts) hook that will return a boolean saying whether the
small layout is currently in use.
