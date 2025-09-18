const BASE_API = 'https://discord.com/api/v10';

export class Rest {
	constructor(private env: Env) {}
	get(route: string, opt: RequestInit) {
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
			Authorization: `Bot ${this.env.TOKEN}`,
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
