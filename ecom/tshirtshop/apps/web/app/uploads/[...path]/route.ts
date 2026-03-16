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

const devCA =
  process.env.NODE_ENV !== "production" && existsSync(mkcertCaRoot)
    ? readFileSync(mkcertCaRoot)
    : undefined;

function buildUpstreamUrl(path: string[], search: string): URL {
  const baseUrl = process.env.API_URL || "https://localhost:3000";
  const upstream = new URL(`/uploads/${path.join("/")}`, baseUrl);
  upstream.search = search;
  return upstream;
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const upstreamUrl = buildUpstreamUrl(path, request.nextUrl.search);

  return new Promise<Response>((resolve, reject) => {
    const transport = upstreamUrl.protocol === "https:" ? https : http;
    const req = transport.request(
      {
        protocol: upstreamUrl.protocol,
        hostname: upstreamUrl.hostname,
        port: upstreamUrl.port
          ? Number(upstreamUrl.port)
          : upstreamUrl.protocol === "https:"
            ? 443
            : 80,
        path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
        method: "GET",
        ...(devCA ? { ca: devCA } : {}),
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (typeof value === "undefined") continue;
            if (Array.isArray(value)) {
              for (const item of value) responseHeaders.append(key, item);
            } else {
              responseHeaders.set(key, value);
            }
          }

          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode || 502,
              statusText: res.statusMessage,
              headers: responseHeaders,
            }),
          );
        });
      },
    );

    req.on("error", reject);
    req.end();
  });
}
