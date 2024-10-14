export const defineDeclare = (name: string, generate: () => string | void) => {
	return () => {
		const content = generate()
		if (content) {
			return {
				fileName: `${name}.d.ts`,
				sourceString: `declare global{
					${content}
				}
				export {}`
			}
		}
	}
}

export type DefineDeclare = ReturnType<typeof defineDeclare>
