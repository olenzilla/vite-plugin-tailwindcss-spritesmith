import { readFileSync } from 'fs'
import tailwindPlugin from 'tailwindcss/plugin'
import { mapKeys } from 'lodash'

export default function tailwind(
	utilities = JSON.parse(
		readFileSync('tailwindcss-spritesmith-utilities.json', 'utf8'),
	),
) {
	return tailwindPlugin(async ({ addUtilities, e }) => {
		addUtilities(mapKeys(utilities, (value, key) => `.${e(key)}`))
	})
}
