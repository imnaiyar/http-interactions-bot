import type { 
	APIApplicationCommandAutocompleteResponse,
	APIInteractionResponseCallbackData,
	APIUser,
	APIGuildMember,
	Snowflake
} from 'discord-api-types/v10';

const BASE_API = 'https://discord.com/api/v10';

export interface RawFile {
	name: string;
	data: Uint8Array | ArrayBuffer;
}

export class Rest {
	constructor(private env: Env) {}

	get(route: string, opt: RequestInit = {}) {
		return this.req(route, { ...opt, method: 'GET' });
	}

	post(route: string, body?: Record<string, any>, opt?: RequestInit) {
		return this.req(route, { ...opt, body: body ? JSON.stringify(body) : undefined, method: 'POST' });
	}

	patch(route: string, body?: Record<string, any>, opt?: RequestInit) {
		return this.req(route, { ...opt, body: body ? JSON.stringify(body) : undefined, method: 'PATCH' });
	}

	delete(route: string, opt?: RequestInit) {
		return this.req(route, { ...opt, method: 'DELETE' });
	}

	private async req(route: string, opt: RequestInit) {
		const headers: Record<string, string> = {
			Authorization: `Bot ${this.env.DISCORD_TOKEN}`,
			...(opt.headers as Record<string, string>),
		};

		if (opt.body) {
			headers['Content-Type'] = 'application/json';
		}

		const r = await fetch(`${BASE_API}${route}`, {
			...opt,
			headers,
		});
		return r;
	}
}

export class DiscordAPI {
	private rest: Rest;

	constructor(private env: Env) {
		this.rest = new Rest(env);
	}

	// User methods
	async getUser(userId: string): Promise<APIUser> {
		const response = await this.rest.get(`/users/${userId}`);
		if (!response.ok) {
			throw new Error(`Failed to get user: ${response.status} ${response.statusText}`);
		}
		return response.json();
	}

	// Guild methods  
	async getGuildMember(guildId: string, userId: string): Promise<APIGuildMember> {
		const response = await this.rest.get(`/guilds/${guildId}/members/${userId}`);
		if (!response.ok) {
			throw new Error(`Failed to get guild member: ${response.status} ${response.statusText}`);
		}
		return response.json();
	}

	// Channel methods
	async createMessage(channelId: string, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
		const response = await this.rest.post(`/channels/${channelId}/messages`, data);
		if (!response.ok) {
			throw new Error(`Failed to create message: ${response.status} ${response.statusText}`);
		}
		return response.json();
	}

	// Interaction methods
	async replyToInteraction(interactionId: string, interactionToken: string, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
		const response = await this.rest.post(`/interactions/${interactionId}/${interactionToken}/callback`, {
			type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
			data
		});
		if (!response.ok) {
			throw new Error(`Failed to reply to interaction: ${response.status} ${response.statusText}`);
		}
		return response;
	}

	async deferInteraction(interactionId: string, interactionToken: string, data?: { flags?: number }) {
		const response = await this.rest.post(`/interactions/${interactionId}/${interactionToken}/callback`, {
			type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
			data
		});
		if (!response.ok) {
			throw new Error(`Failed to defer interaction: ${response.status} ${response.statusText}`);
		}
		return response;
	}

	async editInteractionReply(applicationId: string, interactionToken: string, data: APIInteractionResponseCallbackData & { files?: RawFile[] }, messageId: Snowflake = '@original') {
		const response = await this.rest.patch(`/webhooks/${applicationId}/${interactionToken}/messages/${messageId}`, data);
		if (!response.ok) {
			throw new Error(`Failed to edit interaction reply: ${response.status} ${response.statusText}`);
		}
		return response.json();
	}

	async updateInteractionMessage(interactionId: string, interactionToken: string, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
		const response = await this.rest.post(`/interactions/${interactionId}/${interactionToken}/callback`, {
			type: 7, // UPDATE_MESSAGE
			data
		});
		if (!response.ok) {
			throw new Error(`Failed to update interaction message: ${response.status} ${response.statusText}`);
		}
		return response;
	}

	async deleteInteractionReply(applicationId: string, interactionToken: string, messageId: Snowflake = '@original') {
		const response = await this.rest.delete(`/webhooks/${applicationId}/${interactionToken}/messages/${messageId}`);
		if (!response.ok) {
			throw new Error(`Failed to delete interaction reply: ${response.status} ${response.statusText}`);
		}
		return response;
	}

	async followUpInteraction(applicationId: string, interactionToken: string, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
		const response = await this.rest.post(`/webhooks/${applicationId}/${interactionToken}`, data);
		if (!response.ok) {
			throw new Error(`Failed to follow up interaction: ${response.status} ${response.statusText}`);
		}
		return response.json();
	}

	async createAutocompleteResponse(interactionId: string, interactionToken: string, data: APIApplicationCommandAutocompleteResponse['data']) {
		const response = await this.rest.post(`/interactions/${interactionId}/${interactionToken}/callback`, {
			type: 8, // APPLICATION_COMMAND_AUTOCOMPLETE_RESULT
			data
		});
		if (!response.ok) {
			throw new Error(`Failed to create autocomplete response: ${response.status} ${response.statusText}`);
		}
		return response;
	}
}
