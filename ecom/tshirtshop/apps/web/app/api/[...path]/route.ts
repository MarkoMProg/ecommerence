import { NextRequest } from "next/server";
import http from "http";
import https from "https";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mkcertCaRoot = join(
	process.env.LOCALAPPDATA || "C:\\Users\\nissa\\AppData\\Local",
	"mkcert",
	"rootCA.pem",
);
const backendCa   = join(process.cwd(), "..", "backend", "certs", "ca.pem");
const backendCert = join(process.cwd(), "..", "backend", "certs", "cert.pem");
const devCaPath =
	process.env.NODE_EXTRA_CA_CERTS ||
	(existsSync(mkcertCaRoot) ? mkcertCaRoot : null) ||
	(existsSync(backendCa)   ? backendCa   : null) ||
	(existsSync(backendCert) ? backendCert : null);

// Load CA cert in all environments (dev + Docker/production).
// In Docker: NODE_EXTRA_CA_CERTS=/app/certs/ca.pem is set via env_file;
// in local dev: mkcert rootCA or certs/ca.pem is used.
const customCA = devCaPath ? readFileSync(devCaPath) : undefined;

function buildUpstreamUrl(request: NextRequest, path: string[]): string {
	const baseUrl = process.env.API_URL || "https://localhost:3000";
	const upstream = new URL(`/api/${path.join("/")}`, baseUrl);
	upstream.search = request.nextUrl.search;
	return upstream.toString();
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
	const method = request.method;
	const headers = new Headers(request.headers);
	headers.delete("host");
	headers.delete("content-length");

	const upstreamUrl = new URL(buildUpstreamUrl(request, path));
	const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

	return new Promise<Response>((resolve, reject) => {
		const transport = upstreamUrl.protocol === "https:" ? https : http;
		const req = transport.request(
			{
				protocol: upstreamUrl.protocol,
				hostname: upstreamUrl.hostname,
				port: upstreamUrl.port ? Number(upstreamUrl.port) : upstreamUrl.protocol === "https:" ? 443 : 80,
				path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
				method,
				headers: Object.fromEntries(headers.entries()),
				...(customCA ? { ca: customCA } : {}),
			},
			(res) => {
				const chunks: Buffer[] = [];
				res.on("data", (chunk: Buffer) => chunks.push(chunk));
				res.on("end", () => {
					const status = res.statusCode || 502;
					const hasNoBody = status === 204 || status === 205 || status === 304;
					const responseHeaders = new Headers();
					for (const [key, value] of Object.entries(res.headers)) {
						if (typeof value === "undefined") continue;
						if (Array.isArray(value)) {
							for (const item of value) responseHeaders.append(key, item);
						} else {
							responseHeaders.set(key, value);
						}
					}
					responseHeaders.delete("content-encoding");
					responseHeaders.delete("content-length");

					resolve(
						new Response(hasNoBody ? null : Buffer.concat(chunks), {
							status,
							statusText: res.statusMessage,
							headers: responseHeaders,
						}),
					);
				});
			},
		);

		req.on("error", reject);
		if (body) req.write(Buffer.from(body));
		req.end();
	});
}

type RouteContext = {
	params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
	const { path } = await context.params;
	return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
	const { path } = await context.params;
	return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
	const { path } = await context.params;
	return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
	const { path } = await context.params;
	return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
	const { path } = await context.params;
	return proxy(request, path);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
	const { path } = await context.params;
	return proxy(request, path);
}
