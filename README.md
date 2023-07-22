# @olenzilla/vite-plugin-tailwindcss-spritesmith ![npm](https://img.shields.io/npm/v/@olenzilla/vite-plugin-tailwindcss-spritesmith) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

[![NPM](https://nodei.co/npm/@olenzilla/vite-plugin-tailwindcss-spritesmith.png)](https://nodei.co/npm/@olenzilla/vite-plugin-tailwindcss-spritesmith/)
A Vite plugin for creating:
* a spritesheet image combining a folder of images into a single image
* **instead of creating a CSS file** with the classes for each sprite, **a TailwindCSS plugin** that generates _TailwindCSS utilities_ for each sprite.

Given an image called `example.png` in the configured sprites folder, this plugin allows you not only to use classes like `sprite-example` with all available Tailwind variants like `hover:` and `md:`, but also adds the sprites' heights and widths to your tailwind config for use with existing utilities like `w-sprite-example` or `max-h-sprite-example`.

**Headline: when used in combination with Prettier and [`prettier-plugin-tailwindcss`](https://www.npmjs.com/package/prettier-plugin-tailwindcss), this allows you to have autocompletion for all sprite related classes for your sprites assembled into spritesheets by Spritesmith.**

## Basic Usage

In your `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import tailwindSpritesmithPlugin from '@olenzilla/vite-plugin-tailwindcss-spritesmith'

export default defineConfig({
	plugins: [
		tailwindSpritesmithPlugin({spritesheets: [{
			glob: 'assets/sprites/*.png',
			image: 'assets/target/sprites.png',
			cssImageRef: 'assets/target/sprites.png',
		}]}).vite,
		// ...
	],
})
```

And pass the same configuration in your `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
	// ...
	plugins: [
		require('@olenzilla/vite-plugin-tailwindcss-spritesmith').default({spritesheets: [{
			glob: 'assets/sprites/*.png',
			image: 'assets/target/sprites.png',
			cssImageRef: 'assets/target/sprites.png',
		}]}).tailwind,
		// ...
	],
}
```

## Better Usage

Or better yet, create a single `tailwind-spritesmith.config.js`:
```js
/** @type {import('@olenzilla/vite-plugin-tailwindcss-spritesmith').Config} */
modules.exports = {spritesheets: [{
	glob: 'assets/sprites/*.png',
	image: 'assets/target/sprites.png',
	cssImageRef: 'assets/target/sprites.png',
}]}
```

And require this plugin's `/vite-plugin` and `/tailwind-plugin` in each respective config file.

In your `vite.config.ts`:
```ts
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		require('@olenzilla/vite-plugin-tailwindcss-spritesmith/vite'),
		// ...
	],
})
```

And in your `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
	// ...
	plugins: [
		require('@olenzilla/vite-plugin-tailwindcss-spritesmith/tailwind'),
		// ...
	],
}
```

## Ideal Usage

Best of all, use the single `tailwind-spritesmith.config.js` to configure a folder _of spritesheet folders_:
```js
/** @type {import('@olenzilla/vite-plugin-tailwindcss-spritesmith').Config} */
modules.exports = {
	spritesheetGlob: 'assets/sprites/*',
	imageDir: 'assets'
}
```

And require this plugin's `/vite-plugin` and `/tailwind-plugin` in each respective config file.

In your `vite.config.ts`:
```ts
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		require('@olenzilla/vite-plugin-tailwindcss-spritesmith/vite'),
		// ...
	],
})
```

And in your `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
	// ...
	plugins: [
		require('@olenzilla/vite-plugin-tailwindcss-spritesmith/tailwind'),
		// ...
	],
}
```

With this usage, a folder structure like this:
```
|- assets
	|- sprites
		|- character1
		|	|- character1-a.jpg
		|	|- character1-b.jpg
		|	|- character1-c.jpg
		|	|- character1-c.png
		|- character2
			|- character2-a.jpg
			|- character2-b.jpg
```
Results in the following new files:
```
|- assets
	|- character1.jpg
	|- character1.png
	|- character2.jpg
```
And the following sorts of Tailwind utilities:
* `sprite-character1-a`
* `sprite-character2-b`
* `sprite-character1-c`
  * You can use `errorOnNameConflict` to error when encountering sprites with the same name without extension.
  * You can also use `emitUtilitiesWithExtension` to *also* emit Tailwind utilities with each file's extension:
    * `sprite-character1-c.jpg`
    * `sprite-character1-c.png`

# Acknowledgements
Thanks to [@evont](https://github.com/evont) for [vite-plugin-spritesmith](https://github.com/evont/vite-plugin-spritesmith) and of course [@twolfson](https://github.com/twolfson) for [spritesmith](https://github.com/twolfson/spritesmith)
