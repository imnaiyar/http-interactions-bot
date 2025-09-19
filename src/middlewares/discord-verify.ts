function hextToUint8(value: string): Uint8Array {
	const matches = value.match(/.{1,2}/g);
	if (matches == null) {
		throw new Error('Value is not a valid hex string');
	}
	const hexVal = matches.map((byte: string) => Number.parseInt(byte, 16));
	return new Uint8Array(hexVal);
}

export async function verify(req: Request, env: Env): Promise<boolean> {
	const timestamp = req.headers.get('X-Signature-Timestamp');
	const signature = req.headers.get('X-Signature-Ed25519');

	if (!timestamp || !signature) {
		return false;
	}

	const bodyText = await req.clone().text();

	const message = new TextEncoder().encode(timestamp + bodyText);

	const pubKey = await crypto.subtle.importKey(
		'raw',
		hextToUint8(env.DISCORD_PUBLIC_KEY!),
		{ name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' },
		false,
		['verify'],
	);

	const isValid = await crypto.subtle.verify({ name: 'NODE-ED25519' }, pubKey, hextToUint8(signature), message);
	if (!isValid) return false;

	return true;
}
