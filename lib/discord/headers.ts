import crypto from "crypto";

const CLIENT_VERSION = "1.0.9253";
const CLIENT_BUILD_NUMBER = 594031;
const NATIVE_BUILD_NUMBER = 88414;
const OS_VERSION = "10.0.26200";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 " +
  "Electron/42.7.1 Safari/537.36";

export function generateDiscordHeaders(token: string, referer: string = "https://discord.com/channels/@me"): Record<string, string> {
  const superProperties = {
    os: "Windows",
    browser: "Discord Client",
    release_channel: "stable",
    client_version: CLIENT_VERSION,
    os_version: OS_VERSION,
    os_arch: "x64",
    app_arch: "x64",
    system_locale: "en-GB",
    has_client_mods: false,
    browser_user_agent: USER_AGENT,
    browser_version: "42.7.1",
    os_sdk_version: "26200",
    client_build_number: CLIENT_BUILD_NUMBER,
    native_build_number: NATIVE_BUILD_NUMBER,
    client_event_source: null,
    client_app_state: "focused",
    client_launch_id: crypto.randomUUID(),
    launch_signature: crypto.randomUUID(),
    client_heartbeat_session_id: crypto.randomUUID(),
  };

  const base64SuperProps = Buffer.from(JSON.stringify(superProperties)).toString("base64");

  return {
    accept: "*/*",
    "accept-language": "en-GB,en;q=0.9",
    authorization: token.trim().replace(/^["']|["']$/g, ""),
    priority: "u=1, i",
    "user-agent": USER_AGENT,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-discord-locale": "en-GB",
    "x-discord-timezone": "Africa/Cairo",
    "x-super-properties": base64SuperProps,
    "x-debug-options": "bugReporterEnabled",
    "content-type": "application/json",
    origin: "https://discord.com",
    referer: referer,
  };
}

export function cleanToken(token: string): string {
  if (!token) return "";
  return token.trim().replace(/^["']|["']$/g, "");
}
