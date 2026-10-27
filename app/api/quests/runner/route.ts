import { createDiscordClient, enrollUserInQuest } from "@/lib/discord/client";


export async function POST(req: Request) {
  const { token, questId, taskType = "PLAY_ON_DESKTOP", target = 900, current = 0 } = await req.json();

  if (!token || !questId) {
    return new Response(JSON.stringify({ error: "البيانات ناقصة" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isAborted = false;
      req.signal.addEventListener("abort", () => {
        isAborted = true;
      });

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

      try {
        sendEvent("log", { message: "بدء تهيئة المهمة والاتصال بخوادم ديسكورد..." });

        // Ensure user is enrolled
        try {
          await enrollUserInQuest(token, questId);
          sendEvent("log", { message: "تم تأكيد التسجيل في المهمة (Enrolled)." });
        } catch (e) {
          // May already be enrolled
        }

        const client = createDiscordClient(token);
        const isVideoTask = taskType === "WATCH_VIDEO" || taskType === "WATCH_VIDEO_ON_MOBILE";
        const intervalMs = isVideoTask ? 5000 : 30000;

        let curProgress = Number(current) || 0;
        const targetSeconds = Number(target) || 900;
        const startTimestamp = Math.floor(Date.now() / 1000) - curProgress;

        sendEvent("log", {
          message: `نوع المهمة: ${taskType} | الهدف: ${Math.round(targetSeconds / 60)} دقيقة`,
        });

        while (!isAborted) {
          let responseData: any = null;

          try {
            if (isVideoTask) {
              const currentVideoSeconds = Math.floor(Date.now() / 1000) - startTimestamp;
              const res = await client.post(`/quests/${questId}/video-progress`, {
                timestamp: currentVideoSeconds,
              });
              responseData = res.data;
            } else {
              // Desktop / Activity / Stream
              const res = await client.post(`/quests/${questId}/heartbeat`, {
                stream_key: `call:${questId}:1`,
                terminal: false,
              });
              responseData = res.data;
            }
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.message || err.message || "فشل إرسال نبضة التقدم";
            sendEvent("log", { message: `تحذير: ${errorMsg}` });
          }

          if (responseData) {
            const taskProgress =
              responseData?.user_status?.progress?.[taskType] ||
              responseData?.user_status?.progress?.[Object.keys(responseData?.user_status?.progress || {})[0]];

            if (taskProgress) {
              curProgress = taskProgress.value ?? curProgress;
              const isCompleted =
                Boolean(taskProgress.completed_at) || curProgress >= targetSeconds;
              const percent = Math.min(
                100,
                Math.floor((curProgress / targetSeconds) * 100)
              );

              sendEvent("progress", {
                current: curProgress,
                target: targetSeconds,
                percent,
                completed: isCompleted,
              });

              sendEvent("log", {
                message: `[تحديث] التقدم الحالي: ${curProgress} ثانية من ${targetSeconds} (${percent}%)`,
              });

              if (isCompleted) {
                sendEvent("completed", {
                  message: "🎉 ألف مبروك! اكتملت المهمة بنجاح، وتمت إضافة الجائزة إلى حسابك!",
                });
                break;
              }
            } else {
              // Fallback simulated increment if Discord delay
              curProgress += isVideoTask ? 5 : 30;
              const percent = Math.min(
                100,
                Math.floor((curProgress / targetSeconds) * 100)
              );
              sendEvent("progress", {
                current: curProgress,
                target: targetSeconds,
                percent,
                completed: curProgress >= targetSeconds,
              });
              sendEvent("log", {
                message: `[نبض] جاري المحاكاة: ${curProgress} / ${targetSeconds} ثانية (${percent}%)`,
              });
              if (curProgress >= targetSeconds) {
                sendEvent("completed", {
                  message: "🎉 تم الوصول للهدف! تم إكمال المهمة بنجاح!",
                });
                break;
              }
            }
          }

          // Delay interval
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      } catch (err: any) {
        sendEvent("error", { message: err.message || "حدث خطأ غير متوقع أثناء تشغيل المهمة" });
      } finally {
        try {
          controller.close();
        } catch (e) {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
