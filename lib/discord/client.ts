import axios, { AxiosInstance } from "axios";
import { generateDiscordHeaders, cleanToken } from "./headers";

export function createDiscordClient(token: string): AxiosInstance {
  const cleaned = cleanToken(token);
  return axios.create({
    baseURL: "https://discord.com/api/v9/",
    headers: generateDiscordHeaders(cleaned),
    timeout: 30000,
  });
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
  email?: string | null;
}

export async function fetchDiscordUser(token: string): Promise<DiscordUser | null> {
  try {
    const client = createDiscordClient(token);
    const { data } = await client.get<DiscordUser>("/users/@me");
    if (data?.id) return data;
    return null;
  } catch (err) {
    return null;
  }
}

export interface ParsedQuestTask {
  id: string;
  type: "duration" | "count";
  target: number;
  current: number;
  percent: number;
  completed: boolean;
  enrolled: boolean;
}

export interface ParsedReward {
  name: string;
  type?: number;
  asset?: string;
  expiresAt?: string;
}

export interface ParsedQuest {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  iconUrl: string | null;
  expiresAt: string | null;
  tasks: ParsedQuestTask[];
  overallPercent: number;
  isCompleted: boolean;
  isEnrolled: boolean;
  rewards: ParsedReward[];
  applicationId: string | null;
}

export async function fetchUserQuests(token: string): Promise<ParsedQuest[]> {
  try {
    const client = createDiscordClient(token);
    const { data } = await client.get("/quests/@me");

    if (!Array.isArray(data?.quests)) {
      return [];
    }

    const durationQuestTypes = [
      "PLAY_ON_DESKTOP",
      "PLAY_ACTIVITY",
      "STREAM_ON_DESKTOP",
      "WATCH_VIDEO",
      "WATCH_VIDEO_ON_MOBILE",
    ];

    const results: ParsedQuest[] = [];

    for (const q of data.quests) {
      const cfg = q.config || {};

      // Filter out expired quests that no longer exist in Discord client
      if (cfg.expires_at && new Date(cfg.expires_at).getTime() < Date.now()) {
        continue;
      }

      const userStatus = q.user_status || {};
      const progressObj = userStatus.progress || {};
      const tasksDict = cfg.task_config_v2?.tasks || cfg.task_config?.tasks || {};

      let tasks: ParsedQuestTask[] = Object.keys(tasksDict).map((taskKey) => {
        const taskDef = tasksDict[taskKey];
        const taskProg = progressObj[taskKey];
        const target = taskDef.target || 900;

        let current = 0;
        if (typeof taskProg === "number") {
          current = taskProg;
        } else if (taskProg && typeof taskProg.value === "number") {
          current = taskProg.value;
        } else if (typeof userStatus.stream_progress_seconds === "number" && userStatus.stream_progress_seconds > 0) {
          current = userStatus.stream_progress_seconds;
        } else if (typeof userStatus.streamProgressSeconds === "number" && userStatus.streamProgressSeconds > 0) {
          current = userStatus.streamProgressSeconds;
        } else if (progressObj && Object.keys(progressObj).length > 0) {
          const anyProg = Object.values(progressObj)[0] as any;
          if (typeof anyProg === "number") {
            current = anyProg;
          } else if (anyProg && typeof anyProg.value === "number") {
            current = anyProg.value;
          }
        }

        const completed = Boolean(taskProg?.completed_at) || Boolean(userStatus.completed_at) || (target > 0 && current >= target);
        const percent = completed ? 100 : Math.min(100, Math.max(0, Math.floor((current / target) * 100)));
        const enrolled = Boolean(userStatus.enrolled_at);
        const isDuration = durationQuestTypes.includes(taskKey);

        return {
          id: taskKey,
          type: isDuration ? "duration" : "count",
          target,
          current,
          percent,
          completed,
          enrolled,
        };
      });

      if (tasks.length === 0) {
        const target = 900;
        let current = 0;
        if (typeof userStatus.stream_progress_seconds === "number") {
          current = userStatus.stream_progress_seconds;
        } else if (typeof userStatus.streamProgressSeconds === "number") {
          current = userStatus.streamProgressSeconds;
        } else if (progressObj && Object.keys(progressObj).length > 0) {
          const anyProg = Object.values(progressObj)[0] as any;
          if (typeof anyProg === "number") current = anyProg;
          else if (anyProg?.value) current = anyProg.value;
        }
        const completed = Boolean(userStatus.completed_at) || current >= target;
        const percent = completed ? 100 : Math.min(100, Math.max(0, Math.floor((current / target) * 100)));
        tasks = [{
          id: "PLAY_ON_DESKTOP",
          type: "duration",
          target,
          current,
          percent,
          completed,
          enrolled: Boolean(userStatus.enrolled_at),
        }];
      }

      // Overall percent
      const isCompleted = Boolean(userStatus.completed_at) || (tasks.length > 0 && tasks.some((t) => t.completed));
      const maxPercent = isCompleted ? 100 : (tasks.length > 0 ? Math.max(...tasks.map((t) => t.percent)) : 0);
      const isEnrolled = Boolean(userStatus.enrolled_at);

      // Assets
      const assets = cfg.assets || {};
      const baseCdn = "https://cdn.discordapp.com";

      const resolveCdn = (assetPath?: string | null): string | null => {
        if (!assetPath || assetPath === "PLACEHOLDER") return null;
        if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
          return assetPath;
        }
        if (assetPath.startsWith("quests/")) {
          return `${baseCdn}/${assetPath}`;
        }
        return `${baseCdn}/quests/${q.id}/${assetPath}`;
      };

      const banner = resolveCdn(assets.hero) || resolveCdn(assets.quest_bar_hero);
      const icon =
        resolveCdn(assets.game_tile_dark) ||
        resolveCdn(assets.game_tile_light) ||
        resolveCdn(assets.game_tile) ||
        resolveCdn(assets.logotype_dark) ||
        resolveCdn(assets.hero);

      // Rewards
      const rewards: ParsedReward[] = [];
      const rawRewards = cfg.rewards_config?.rewards || [];
      for (const r of rawRewards) {
        const rewardName = r.messages?.name || "مكافأة حصرية";
        rewards.push({
          name: rewardName,
          type: r.type,
          asset: resolveCdn(r.asset) || undefined,
          expiresAt: r.expires_at,
        });
      }

      results.push({
        id: q.id,
        title: cfg.messages?.quest_name || "Discord Quest",
        description: cfg.messages?.game_title || "",
        bannerUrl: banner,
        iconUrl: icon,
        expiresAt: cfg.expires_at || null,
        tasks,
        overallPercent: maxPercent,
        isCompleted,
        isEnrolled,
        rewards,
        applicationId: cfg.application?.id || null,
      });
    }

    return results;
  } catch (err) {
    return [];
  }
}

export async function enrollUserInQuest(token: string, questId: string): Promise<{ success: boolean; alreadyEnrolled: boolean; error?: string; retryAfter?: number }> {
  const client = createDiscordClient(token);

  // First check if already enrolled without sending unnecessary POST
  try {
    const meRes = await client.get("/quests/@me");
    const found = meRes.data?.quests?.find((q: any) => q.id === questId);
    if (found?.user_status?.enrolled_at) {
      return { success: true, alreadyEnrolled: true };
    }
  } catch (e) { }

  // Try to enroll
  try {
    const url = `/quests/${questId}/enroll`;
    const res = await client.post(url, {
      location: 11,
      is_targeted: false,
      metadata_raw: null,
    });
    if (res.data?.enrolled_at) {
      return { success: true, alreadyEnrolled: false };
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg: string = data?.message || err.message || "";

    // If rate limited, capture retry_after
    if (status === 429) {
      const retryAfter = typeof data?.retry_after === "number" ? Math.ceil(data.retry_after) : 5;
      return { success: false, alreadyEnrolled: false, error: "You are being rate limited.", retryAfter };
    }

    // 400 often means already enrolled — re-verify
    if (status !== 400 && !msg.toLowerCase().includes("already")) {
      return { success: false, alreadyEnrolled: false, error: msg };
    }
  }

  // Verify enrollment after the call
  try {
    const meRes2 = await client.get("/quests/@me");
    const found2 = meRes2.data?.quests?.find((q: any) => q.id === questId);
    if (found2?.user_status?.enrolled_at) {
      return { success: true, alreadyEnrolled: false };
    }
  } catch (e) { }

  return { success: false, alreadyEnrolled: false, error: "تعذر التسجيل في المهمة، يرجى تفعيلها من تطبيق ديسكورد." };
}
