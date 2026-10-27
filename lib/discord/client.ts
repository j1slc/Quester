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

      const tasks: ParsedQuestTask[] = Object.keys(tasksDict).map((taskKey) => {
        const taskDef = tasksDict[taskKey];
        const taskProg = progressObj[taskKey];
        const target = taskDef.target || 1;
        const current = taskProg?.value ?? 0;
        const percent = Math.min(100, Math.floor((current / target) * 100));
        const completed = Boolean(taskProg?.completed_at) || percent >= 100;
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

      // Overall percent
      const maxPercent = tasks.length > 0 ? Math.max(...tasks.map((t) => t.percent)) : 0;
      const isCompleted = tasks.length > 0 && tasks.some((t) => t.completed);
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

export async function enrollUserInQuest(token: string, questId: string): Promise<boolean> {
  try {
    const client = createDiscordClient(token);
    const url = `/quests/${questId}/enroll`;
    const res = await client.post(url, {
      location: 11,
      is_targeted: false,
      metadata_raw: null,
    });
    return Boolean(res.data?.enrolled_at);
  } catch (err) {
    return false;
  }
}

