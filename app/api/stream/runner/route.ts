import { cleanToken } from "@/lib/discord/headers";
import { fetchDiscordChannel, fetchDiscordUser } from "@/lib/discord/client";

export async function POST(req: Request) {
  const { token, channelId, targetHours = 75 } = await req.json();

  if (!token || !channelId) {
    return new Response(JSON.stringify({ error: "بيانات التوكن أو الروم الصوتي ناقصة" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanedToken = cleanToken(token);
  const targetSeconds = Math.max(1, Number(targetHours) || 75) * 3600;

  // 1. Verify channel & user
  const [user, channel] = await Promise.all([
    fetchDiscordUser(cleanedToken),
    fetchDiscordChannel(cleanedToken, String(channelId).trim()),
  ]);

  if (!user) {
    return new Response(JSON.stringify({ error: "التوكن غير صحيح أو انتهت صلاحيته" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!channel || !channel.guild_id) {
    return new Response(
      JSON.stringify({ error: "الروم غير موجود أو ليس بروم صوتي داخل سيرفر" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const guildId = channel.guild_id;
  const targetChannelId = channel.id;
  const userId = user.id;
  const streamKey = `guild:${guildId}:${targetChannelId}:${userId}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isAborted = false;
      let heartbeatTimer: any = null;
      let progressTimer: any = null;
      let ws: WebSocket | null = null;
      let streamStartTime = 0;

      const sendEvent = (event: string, data: any) => {
        if (isAborted) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch (e) {
          isAborted = true;
        }
      };

      const cleanup = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (progressTimer) clearInterval(progressTimer);

        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            // Delete stream (Opcode 19)
            ws.send(JSON.stringify({ op: 19, d: { stream_key: streamKey } }));
            // Leave voice channel (Opcode 4)
            ws.send(
              JSON.stringify({
                op: 4,
                d: {
                  guild_id: guildId,
                  channel_id: null,
                  self_mute: true,
                  self_deaf: false,
                  self_video: false,
                },
              })
            );
            ws.close(1000);
          } catch (e) {
            // Ignore socket closure errors
          }
        }
      };

      req.signal.addEventListener("abort", () => {
        isAborted = true;
        cleanup();
        try {
          controller.close();
        } catch (e) {}
      });

      try {
        sendEvent("log", {
          message: `تم التحقق من الحساب: ${user.global_name || user.username} (${user.id})`,
        });
        sendEvent("log", {
          message: `الروم الصوتي المستهدف: #${channel.name} في السيرفر (${guildId})`,
        });
        sendEvent("log", { message: "جاري الاتصال ببوابة ديسكورد (Discord Gateway)..." });

        ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");

        ws.onopen = () => {
          sendEvent("log", { message: "تم فتح الاتصال مع خوادم Gateway بنجاح." });
        };

        ws.onmessage = async (event) => {
          if (isAborted) return;
          try {
            const payload = JSON.parse(event.data.toString());
            const { op, d, t } = payload;

            // Opcode 10: Hello -> start heartbeat & identify
            if (op === 10) {
              const interval = d.heartbeat_interval;
              sendEvent("log", { message: "تم استلام مفتاح النبض (Heartbeat). بدء تسجيل الدخول..." });

              // Send immediate first heartbeat
              ws?.send(JSON.stringify({ op: 1, d: null }));

              heartbeatTimer = setInterval(() => {
                if (ws?.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 1, d: null }));
                }
              }, interval);

              // Send Opcode 2: Identify
              const identifyPayload = {
                op: 2,
                d: {
                  token: cleanedToken,
                  capabilities: 16381,
                  properties: {
                    os: "Windows",
                    browser: "Discord Client",
                    release_channel: "stable",
                    client_version: "1.0.9168",
                    os_version: "10.0.19045",
                    os_arch: "x64",
                    system_locale: "ar",
                    browser_user_agent:
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9168 Chrome/128.0.6613.186 Electron/32.2.2 Safari/537.36",
                    browser_version: "32.2.2",
                    client_build_number: 339659,
                  },
                  presence: {
                    status: "online",
                    since: 0,
                    activities: [],
                    afk: false,
                  },
                  compress: false,
                  client_state: { guild_versions: {} },
                },
              };
              ws?.send(JSON.stringify(identifyPayload));
            }

            // Dispatch events
            if (op === 0) {
              if (t === "READY") {
                sendEvent("log", { message: "تم تسجيل الدخول بنجاح! جاري الانضمام للروم الصوتي..." });

                // Join voice channel (Opcode 4) - camera OFF
                ws?.send(
                  JSON.stringify({
                    op: 4,
                    d: {
                      guild_id: guildId,
                      channel_id: targetChannelId,
                      self_mute: true,
                      self_deaf: false,
                      self_video: false,
                    },
                  })
                );

                // Small delay then create stream (Opcode 18)
                setTimeout(() => {
                  if (ws?.readyState === WebSocket.OPEN && !isAborted) {
                    sendEvent("log", {
                      message: "جاري تفعيل إشارة شير الشاشة Go Live...",
                    });

                    ws.send(
                      JSON.stringify({
                        op: 18,
                        d: {
                          type: "guild",
                          guild_id: String(guildId),
                          channel_id: String(targetChannelId),
                          preferred_region: null,
                        },
                      })
                    );

                    // Unpause stream (Opcode 22) -> shows the green monitor icon!
                    setTimeout(() => {
                      if (ws?.readyState === WebSocket.OPEN && !isAborted) {
                        ws.send(
                          JSON.stringify({
                            op: 22,
                            d: {
                              stream_key: streamKey,
                              paused: false,
                            },
                          })
                        );

                        streamStartTime = Date.now();
                        sendEvent("log", {
                          message: "🟢 تم تفعيل Go Live بنجاح! الشاشة الخضراء نشطة الآن.",
                        });
                        sendEvent("status", { state: "streaming", active: true });

                        // Start Progress reporting loop
                        progressTimer = setInterval(() => {
                          if (isAborted) return;
                          const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
                          const remaining = Math.max(0, targetSeconds - elapsed);
                          const percent = Math.min(
                            100,
                            Math.floor((elapsed / targetSeconds) * 100)
                          );

                          sendEvent("progress", {
                            current: elapsed,
                            target: targetSeconds,
                            remaining,
                            percent,
                            completed: elapsed >= targetSeconds,
                          });

                          // Keep-alive unpause every 5 minutes
                          if (elapsed % 300 === 0 && ws?.readyState === WebSocket.OPEN) {
                            ws.send(
                              JSON.stringify({
                                op: 22,
                                d: { stream_key: streamKey, paused: false },
                              })
                            );
                          }

                          if (elapsed >= targetSeconds) {
                            sendEvent("log", {
                              message: `🎉 اكتملت المدة المطلوبة (${targetHours} ساعة) بنجاح!`,
                            });
                            cleanup();
                            controller.close();
                          }
                        }, 5000); // Send update every 5 seconds
                      }
                    }, 500);
                  }
                }, 1000);
              }
            }
          } catch (err: any) {
            sendEvent("log", { message: `خطأ في معالجة الحزمة: ${err.message}` });
          }
        };

        ws.onerror = (e) => {
          sendEvent("log", { message: "حدث خطأ في اتصال WebSocket مع ديسكورد." });
        };

        ws.onclose = (event) => {
          if (!isAborted) {
            sendEvent("log", {
              message: `تم إغلاق الاتصال مع ديسكورد (الكود: ${event.code}).`,
            });
            sendEvent("status", { state: "disconnected", active: false });
          }
        };
      } catch (err: any) {
        sendEvent("log", { message: `فشل تشغيل الستريم: ${err.message}` });
        cleanup();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
