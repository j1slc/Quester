"""
====================================================
           Quester - Auto Stream Bot
    Auto Voice & Screen Share for Discord Badge
====================================================
"""

import asyncio
import sys
import time
from datetime import datetime

try:
    import discord
except ImportError:
    print("[ERROR] discord.py-self library not found!")
    print("[HINT] Run: pip install discord.py-self")
    sys.exit(1)

try:
    from config import TOKEN, VOICE_CHANNEL_ID, STREAM_HOURS
except ImportError:
    print("[ERROR] config.py file not found!")
    sys.exit(1)


# --------------------------------------------------
def format_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def log(msg: str):
    now = datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] {msg}")


# --------------------------------------------------
class StreamBot(discord.Client):
    def __init__(self):
        super().__init__()
        self.stream_start: float = 0
        self.target_seconds = STREAM_HOURS * 3600
        self.stream_key: str | None = None

    async def on_ready(self):
        log(f"[OK] Connected as: {self.user} ({self.user.id})")
        log(f"[INFO] Target: {STREAM_HOURS} hours")
        await self.run_stream()

    async def run_stream(self):
        channel = self.get_channel(VOICE_CHANNEL_ID)

        if not channel:
            log(f"[ERROR] Channel not found! ID: {VOICE_CHANNEL_ID}")
            log("[HINT] Make sure VOICE_CHANNEL_ID is correct in config.py")
            await self.close()
            return

        if not isinstance(channel, discord.VoiceChannel):
            log("[ERROR] The specified channel is not a voice channel!")
            await self.close()
            return

        log(f"[CONNECTING] Channel: {channel.name} - Guild: {channel.guild.name}")

        try:
            # 1. Join voice channel with camera OFF (self_video=False)
            log("[CONNECTING] Joining voice channel...")
            await self.ws.voice_state(
                channel.guild.id,
                channel.id,
                self_mute=True,
                self_deaf=False,
                self_video=False,  # Camera OFF so it doesn't show grey camera
            )
            await asyncio.sleep(1)

            # 2. Build stream key: guild:<guild_id>:<channel_id>:<user_id>
            self.stream_key = f"guild:{channel.guild.id}:{channel.id}:{self.user.id}"

            # 3. Send Opcode 18: STREAM_CREATE (Go Live / Screen Share)
            log("[STREAM] Sending Go Live (Screen Share) signal...")
            await self.ws.send_as_json({
                "op": 18,
                "d": {
                    "type": "guild",
                    "guild_id": str(channel.guild.id),
                    "channel_id": str(channel.id),
                    "preferred_region": None,
                }
            })

            await asyncio.sleep(0.5)

            # 4. Send Opcode 22: STREAM_SET_PAUSED = False (Activates green screen icon)
            await self.ws.send_as_json({
                "op": 22,
                "d": {
                    "stream_key": self.stream_key,
                    "paused": False,
                }
            })

            self.stream_start = time.time()
            log("[LIVE] Go Live Screen Share is ACTIVE! (Green monitor icon)")
            log("=" * 60)

            # Monitoring loop
            await self._monitor_loop(channel)

        except Exception as e:
            log(f"[ERROR] Failed to start stream: {e}")
            await self.close()

    async def _monitor_loop(self, channel: discord.VoiceChannel):
        target = self.target_seconds
        check_interval = 60  # Check every 60 seconds

        while True:
            elapsed = time.time() - self.stream_start
            remaining = max(0, target - elapsed)
            percent = min(100, (elapsed / target) * 100)

            filled = int(percent / 5)
            bar = "#" * filled + "-" * (20 - filled)

            log(
                f"[{bar}] {percent:.1f}% | "
                f"Elapsed: {format_time(elapsed)} | "
                f"Remaining: {format_time(remaining)}"
            )

            # Heartbeat: maintain unpaused stream state every 10 minutes
            if int(elapsed) % 600 < 60 and self.stream_key:
                try:
                    await self.ws.send_as_json({
                        "op": 22,
                        "d": {
                            "stream_key": self.stream_key,
                            "paused": False,
                        }
                    })
                except Exception:
                    pass

            if elapsed >= target:
                log("=" * 60)
                log(f"[DONE] Stream completed! {STREAM_HOURS} hours finished.")
                log("[DONE] Check your Discord streaming badge!")
                break

            await asyncio.sleep(check_interval)

        # Leave channel and end stream on finish
        await self._leave_voice(channel)
        await self.close()

    async def _leave_voice(self, channel: discord.VoiceChannel):
        try:
            if self.stream_key:
                # Opcode 19: STREAM_DELETE
                await self.ws.send_as_json({
                    "op": 19,
                    "d": {
                        "stream_key": self.stream_key,
                    }
                })
            await self.ws.voice_state(channel.guild.id, None)
            log("[DISCONNECTED] Left voice channel and ended stream.")
        except Exception:
            pass

    async def on_disconnect(self):
        log("[WARN] Connection lost! Reconnecting...")

    async def close(self):
        try:
            channel = self.get_channel(VOICE_CHANNEL_ID)
            if channel and self.ws:
                await self._leave_voice(channel)
        except Exception:
            pass
        await super().close()


# --------------------------------------------------
def main():
    print("==========================================")
    print("        Quester - Auto Stream Bot         ")
    print("==========================================")
    print()

    if not TOKEN or TOKEN == "YOUR_TOKEN_HERE":
        print("[ERROR] Please set TOKEN in config.py first!")
        sys.exit(1)

    if not VOICE_CHANNEL_ID:
        print("[ERROR] Please set VOICE_CHANNEL_ID in config.py!")
        sys.exit(1)

    log(f"[START] Running | Target: {STREAM_HOURS}h in channel {VOICE_CHANNEL_ID}")
    log("[HINT] Press Ctrl+C to stop anytime")
    print()

    bot = StreamBot()
    try:
        try:
            bot.run(TOKEN, log_handler=None)
        except TypeError:
            bot.run(TOKEN)
    except KeyboardInterrupt:
        log("[STOPPED] Stopped by user.")
    except discord.LoginFailure:
        log("[ERROR] Invalid or expired token!")
    except Exception as e:
        log(f"[ERROR] {e}")


if __name__ == "__main__":
    main()
