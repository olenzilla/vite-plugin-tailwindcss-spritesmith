import { Plugin } from 'rollup'
import { existsSync, writeFile, rm } from 'fs'
import { join, resolve, basename, dirname } from 'path'
import { memoize } from 'lodash'
import { glob } from 'glob'
import { Path } from 'path-scurry'
import { CSSRuleObject } from 'tailwindcss/types/config'
import Spritesmith from 'spritesmith'
import { mkdirp } from 'mkdirp'

type Config = {
	spritesheets?:
		| SpritesheetConfig[]
		| ({
				spritesDirGlob: string
				outputBackgroundImage?(outputImage: string): string
				/**
				 * @default ```
				 * ['png', 'jpg']
				 * ```
				 */
				extensions?: string[]
		  } & (
				| {
						outputDir: string
						outputImage?(spritesDir: Path, extension: string): string
				  }
				| { outputImage(spritesDir: Path, extension: string): string }
		  ))
	emitUtilitiesWithExtension?: boolean
	errorOnNameConflict?: boolean
}
type SpritesheetConfig = {
	spriteImageGlob: string
	outputImage: string
	outputBackgroundImage?(outputImage: string): string
}
export default function vite(
	configOrPath?: Config | string,
	tailwindcssOutputUtilitiesJson = 'tailwindcss-spritesmith-utilities.json',
) {
	const {
		spritesheets = [],
		emitUtilitiesWithExtension,
		errorOnNameConflict,
	} = (function validateConfig() {
		if (!configOrPath || typeof configOrPath == 'string') {
			const path = configOrPath ?? 'tailwind-spritesmith.config.js'
			if (existsSync(resolve(path))) {
				return require(path) as Config
			}
		} else {
			return configOrPath
		}
	})() ?? {}

	async function getSpritesheetConfigs() {
		return filterBoolean(
			Array.isArray(spritesheets)
				? spritesheets
				: await (async function () {
						const { spritesDirGlob, extensions, outputBackgroundImage } =
							spritesheets
						const outputImage =
							'outputDir' in spritesheets
								? spritesheets.outputImage ??
								  function (spritesDir, ext) {
										return join(
											spritesheets.outputDir,
											`${spritesDir.name}.${ext}`,
										)
								  }
								: spritesheets.outputImage
						return (
							await glob(spritesDirGlob, { withFileTypes: true })
						).flatMap((spritesDir) => {
							if (spritesDir.isDirectory()) {
								return (extensions ?? ['png', 'jpg']).map(
									function (ext): SpritesheetConfig {
										return {
											spriteImageGlob: join(
												spritesDir.path,
												spritesDir.name,
												`./*.${ext}`,
											),
											outputImage: outputImage(spritesDir, ext),
											outputBackgroundImage,
										}
									},
								)
							}
						})
				  })(),
		)
	}

	async function getSpritesInfo() {
		const allUtilities: string[] = []
		return (await getSpritesheetConfigs()).reduce(
			async (
				lastResult,
				{
					spriteImageGlob,
					outputImage,
					outputBackgroundImage = function (outputImage) {
						return `url(${outputImage})`
					},
				},
			) => {
				const result = await lastResult
				const backgroundImage = outputBackgroundImage(outputImage)
				result[outputImage] = {
					backgroundImage,
					spriteImages: await glob(spriteImageGlob),
				}
				return result
			},
			Promise.resolve<
				Record<
					string,
					{
						backgroundImage: string
						spriteImages: string[]
					}
				>
			>({}),
		)
	}

	const getUtilities = memoize(async function (spritesInfoString: string) {
		const spritesInfo: PromiseType<ReturnType<typeof getSpritesInfo>> =
			JSON.parse(spritesInfoString)
		const utilities = await Object.entries(spritesInfo).reduce(
			async (lastResult, [outputImage, { backgroundImage, spriteImages }]) => {
				if (!spriteImages.length) {
					return lastResult
				}
				const result = await lastResult
				const spritesheetResult: Spritesmith.SpritesmithResult =
					await new Promise(async (resolve, reject) =>
						Spritesmith.run({ src: spriteImages }, function (err, images) {
							if (err) {
								reject(err)
							} else {
								resolve(images)
							}
						}),
					)

				Object.entries(spritesheetResult.coordinates).forEach(
					([spriteImage, { x, y, width, height }]) => {
						const utility = {
							'&': {
								backgroundImage,
								backgroundPosition: `${
									((x / spritesheetResult.properties.width) *
										100 *
										spritesheetResult.properties.width) /
									width
								}% ${
									((y / spritesheetResult.properties.height) *
										100 *
										spritesheetResult.properties.height) /
									height
								}%`,
								backgroundSize: `${
									(spritesheetResult.properties.width / width) * 100
								}% ${(spritesheetResult.properties.height / height) * 100}%`,
								width: `${width}px`,
								overflow: 'hidden',
							},
							'&:before': {
								content: "''",
								display: 'block',
								paddingTop: `${(height / width) * 100}%`,
								width: `${width}px`,
								maxWidth: '100%',
							},
						}
						const withExtension = basename(spriteImage)
						const withoutExtension = withExtension.replace(/\.\w+$/, '')
						if (emitUtilitiesWithExtension) {
							const nameWithExtension = `sprite-${withExtension}`
							if (errorOnNameConflict) {
								if (nameWithExtension in result) {
									throw new Error(
										`Sprite utility name conflict! ${nameWithExtension}`,
									)
								}
							}
							result[nameWithExtension] = utility
						}
						{
							const nameWithoutExtension = `sprite-${withoutExtension}`
							if (errorOnNameConflict) {
								if (nameWithoutExtension in result) {
									throw new Error(
										`Sprite utility name conflict! ${nameWithoutExtension}`,
									)
								}
							}
							result[nameWithoutExtension] = utility
						}
					},
				)

				if (existsSync(outputImage)) {
					await new Promise((resolve) => rm(outputImage, resolve))
				} else {
					await mkdirp(dirname(outputImage))
				}
				await new Promise<void>((resolve, reject) => {
					writeFile(outputImage, spritesheetResult.image, 'binary', (err) => {
						if (err) {
							reject(err)
						} else resolve()
					})
				})

				return result
			},
			Promise.resolve({} as CSSRuleObject),
		)
		return utilities
	})
	const plugin: Plugin = {
		name: 'tailwindcss-spritesmith',
		watchChange: {
			sequential: true,
			handler,
		},
		buildStart: {
			sequential: true,
			handler,
		},
	}
	async function handler() {
		const utilities = await getUtilities(JSON.stringify(await getSpritesInfo()))

		await new Promise<void>((resolve, reject) =>
			writeFile(
				tailwindcssOutputUtilitiesJson,
				JSON.stringify(utilities, undefined, '\t'),
				'utf8',
				(err) => {
					if (err) {
						reject(err)
					} else resolve()
				},
			),
		)
	}

	return plugin
}

function filterBoolean<T>(array: T[]) {
	return array.filter(Boolean) as Exclude<
		T,
		void | undefined | null | false | 0 | ''
	>[]
}

function logAndReturn<T>(val: T, ...logArgs: any[]) {
	console.log(...logArgs, val)
	return val
}

type PromiseType<T> = T extends Promise<infer U> ? U : T
