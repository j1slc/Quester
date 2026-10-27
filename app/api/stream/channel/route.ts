import { NextResponse } from "next/server";
import { fetchDiscordChannel } from "@/lib/discord/client";

export async function POST(req: Request) {
  try {
    const { token, channelId } = await req.json();

    if (!token || !channelId) {
      return NextResponse.json({ error: "Missing token or channelId" }, { status: 400 });
    }

    const channel = await fetchDiscordChannel(token, channelId.trim());

    if (!channel) {
      return NextResponse.json(
        { error: "الروم غير موجود أو التوكن لا يمتلك صلاحية رؤيته" },
        { status: 404 }
      );
    }

    // 2 = GUILD_VOICE, 13 = GUILD_STAGE_VOICE
    if (channel.type !== 2 && channel.type !== 13) {
      return NextResponse.json(
        { error: `هذا الروم (${channel.name}) ليس روماً صوتياً!` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: channel.id,
      guild_id: channel.guild_id,
      name: channel.name,
      type: channel.type,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch channel" }, { status: 500 });
  }
}
