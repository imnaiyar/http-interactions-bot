import { APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataOption } from 'discord-api-types/v10';

export function resolveOption(
	options: (APIApplicationCommandInteractionDataOption | APIApplicationCommandInteractionDataBasicOption)[]
): APIApplicationCommandInteractionDataBasicOption[] {
	for (const opt of options) {
		if (opt.type === 1 || opt.type === 2) {
			if (opt.options) return resolveOption(opt.options);
		}
	}
	return options as APIApplicationCommandInteractionDataBasicOption[];
}

export function resolveSubs(opts: APIApplicationCommandInteractionDataOption[]): {
	subcommand?: string;
	subcommandGroup?: string;
} {
	if (!opts.length) return {};
	let subcommand: string | undefined;
	let subcommandGroup: string | undefined;

	const resolveName = (o: typeof opts): void => {
		for (const option of o) {
			if (option.type === 1) {
				// SUB_COMMAND
				subcommand = option.name;
			} else if (option.type === 2) {
				// SUB_COMMAND_GROUP
				subcommandGroup = option.name;
				if (option.options) {
					resolveName(option.options);
				}
			}
		}
	};

	resolveName(opts);
	return { subcommand, subcommandGroup };
}
