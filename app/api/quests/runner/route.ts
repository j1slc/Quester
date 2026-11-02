import { createDiscordClient, enrollUserInQuest } from "@/lib/discord/client";

function extractProgressFromData(data: any, taskType: string): { current: number | null; completed: boolean } {
  if (!data) return { current: null, completed: false };

  const userStatus = data.user_status || data;
  const progressObj = userStatus.progress || data.progress;
  let current: number | null = null;
  let completed = Boolean(userStatus.completed_at || data.completed_at);

  if (progressObj && typeof progressObj === "object") {
    const taskProg = progressObj[taskType] || Object.values(progressObj)[0];
    if (typeof taskProg === "number") {
      current = taskProg;
    } else if (taskProg && typeof taskProg === "object") {
      if (typeof taskProg.value === "number") {
        current = taskProg.value;
      }
      if (taskProg.completed_at) {
        completed = true;
      }
    }
  }

  if (current === null) {
    if (typeof userStatus.stream_progress_seconds === "number" && userStatus.stream_progress_seconds > 0) {
      current = userStatus.stream_progress_seconds;
    } else if (typeof data.stream_progress_seconds === "number" && data.stream_progress_seconds > 0) {
      current = data.stream_progress_seconds;
    } else if (typeof userStatus.streamProgressSeconds === "number" && userStatus.streamProgressSeconds > 0) {
      current = userStatus.streamProgressSeconds;
    } else if (typeof data.streamProgressSeconds === "number" && data.streamProgressSeconds > 0) {
      current = data.streamProgressSeconds;
    }
  }

  return { current, completed };
}

// Build the correct heartbeat body depending on task type
function buildHeartbeatBody(taskType: string, questId: string, terminal = false) {
  const isActivity = taskType === "PLAY_ACTIVITY";
  const isStream = taskType === "STREAM_ON_DESKTOP";

  if (isActivity || isStream) {
    return {
      stream_key: `call:${questId}:1`,
      terminal,
    };
  }

  // PLAY_ON_DESKTOP and similar — no stream_key needed
  return { terminal };
}

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

        const client = createDiscordClient(token);

        // Step 1: verify quest exists and check enrollment
        let isEnrolled = false;
        try {
          const meRes = await client.get("/quests/@me");
          const foundQuest = meRes.data?.quests?.find((q: any) => q.id === questId);
          if (foundQuest?.user_status?.enrolled_at) {
            isEnrolled = true;
            sendEvent("log", { message: "المستخدم مسجّل بالفعل في المهمة ✅" });
          }
        } catch (e) {}

        // Step 2: enroll if not enrolled
        if (!isEnrolled) {
          sendEvent("log", { message: "جاري التسجيل في المهمة..." });
          let enrollResult = await enrollUserInQuest(token, questId);

          // If rate limited on enroll, wait for retry_after and retry once automatically
          if (!enrollResult.success && enrollResult.retryAfter) {
            const waitSec = Math.min(15, enrollResult.retryAfter);
            sendEvent("log", {
              message: `⏳ ديسكورد فرض مهلة انتظار (${waitSec} ثوانٍ)، جاري الانتظار والمحاولة مجدداً تلقائياً...`,
            });
            await new Promise((r) => setTimeout(r, (waitSec + 1) * 1000));
            enrollResult = await enrollUserInQuest(token, questId);
          }

          if (enrollResult.success) {
            isEnrolled = true;
            sendEvent("log", {
              message: enrollResult.alreadyEnrolled
                ? "المستخدم مسجّل بالفعل ✅"
                : "تم التسجيل في المهمة بنجاح ✅",
            });
          } else {
            sendEvent("log", {
              message: `⚠️ فشل التسجيل: ${enrollResult.error || "غير معروف"}`,
            });
          }
        }

        if (!isEnrolled) {
          sendEvent("error", {
            message: "❌ الحساب واجه Rate Limit من ديسكورد، أو لم يقبل المهمة. افتح ديسكورد واضغط Accept على المهمة يدوياً، أو انتظر دقيقة وأعد المحاولة.",
          });
          return;
        }

        const isVideoTask = taskType === "WATCH_VIDEO" || taskType === "WATCH_VIDEO_ON_MOBILE";
        const intervalMs = isVideoTask ? 5000 : 20000;

        let curProgress = Number(current) || 0;
        const targetSeconds = Number(target) || 900;
        const startTimestamp = Math.floor(Date.now() / 1000) - curProgress;

        sendEvent("log", {
          message: `نوع المهمة: ${taskType} | الهدف: ${Math.round(targetSeconds / 60)} دقيقة`,
        });

        // Send initial progress immediately
        const initialPercent = targetSeconds > 0 ? Math.min(100, Math.floor((curProgress / targetSeconds) * 100)) : 0;
        sendEvent("progress", {
          current: curProgress,
          target: targetSeconds,
          percent: initialPercent,
          completed: curProgress >= targetSeconds,
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
              const isCompleting = curProgress + 20 >= targetSeconds;
              const body = buildHeartbeatBody(taskType, questId, isCompleting);
              const res = await client.post(`/quests/${questId}/heartbeat`, body);
              responseData = res.data;
            }
          } catch (err: any) {
            const status = err.response?.status;
            const errorMsg = err.response?.data?.message || err.message || "فشل إرسال نبضة التقدم";

            if (status === 403 || (errorMsg as string).toLowerCase().includes("not enrolled")) {
              sendEvent("error", {
                message: "❌ الحساب غير مسجّل في المهمة. افتح Discord وقبل المهمة يدوياً ثم حاول مجدداً.",
              });
              break;
            }
            sendEvent("log", { message: `تحذير: ${errorMsg}` });
          }

          let extracted = extractProgressFromData(responseData, taskType);

          // Fallback: fetch fresh data from Discord if POST response had no progress
          if (extracted.current === null) {
            try {
              const meRes = await client.get("/quests/@me");
              const foundQuest = meRes.data?.quests?.find((q: any) => q.id === questId);
              if (foundQuest?.user_status) {
                const fresh = extractProgressFromData(foundQuest.user_status, taskType);
                if (fresh.current !== null) {
                  extracted = fresh;
                }
              }
            } catch (e) {}
          }

          if (extracted.current !== null) {
            curProgress = extracted.current;
            const isCompleted = extracted.completed || curProgress >= targetSeconds;
            const percent = isCompleted ? 100 : Math.min(100, Math.floor((curProgress / targetSeconds) * 100));

            sendEvent("progress", {
              current: curProgress,
              target: targetSeconds,
              percent,
              completed: isCompleted,
            });

            sendEvent("log", {
              message: `[Discord] التقدم الفعلي: ${curProgress}s / ${targetSeconds}s (${percent}%)`,
            });

            if (isCompleted) {
              console.log(`[RUNNER] Quest ${questId} completed! Sending completed event.`);
              sendEvent("completed", {
                message: "🎉 ألف مبروك! اكتملت المهمة بنجاح، وتمت إضافة الجائزة إلى حسابك!",
              });
              break;
            }
          } else {
            // Fallback increment (server unreachable)
            curProgress += isVideoTask ? 5 : 20;
            const isCompleted = curProgress >= targetSeconds;
            const percent = Math.min(100, Math.floor((curProgress / targetSeconds) * 100));

            sendEvent("progress", {
              current: curProgress,
              target: targetSeconds,
              percent,
              completed: isCompleted,
            });

            sendEvent("log", {
              message: `[محاكاة] التقدم: ${curProgress}s / ${targetSeconds}s (${percent}%)`,
            });

            if (isCompleted) {
              console.log(`[RUNNER] Quest ${questId} simulation completed! Sending completed event.`);
              sendEvent("completed", {
                message: "🎉 تم الوصول للهدف!",
              });
              break;
            }
          }

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
