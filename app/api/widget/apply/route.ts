import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, appId: inputAppId, heroTitle, heroImage, widgets } = await req.json();

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "يرجى إدخال رمز التوكن (Discord Token) الخاص بحسابك." },
        { status: 400 }
      );
    }

    const cleanedToken = token.trim().replace(/^["']|["']$/g, "");
    const userHeaders: HeadersInit = {
      "Authorization": cleanedToken,
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    };

    // 1. Get User Profile (@me)
    const meRes = await fetch("https://discord.com/api/v9/users/@me", {
      headers: userHeaders,
    });

    if (!meRes.ok) {
      if (meRes.status === 401) {
        return NextResponse.json(
          { error: "رمز التوكن غير صالح أو منتهي الصلاحية. يرجى التأكد من نسخه بشكل صحيح." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `فشل التحقق من الحساب (HTTP ${meRes.status}).` },
        { status: meRes.status }
      );
    }

    const userData = await meRes.json();
    const userId = userData.id;

    // Build the surfaces object
    const statsObj: Record<string, any> = {};
    if (Array.isArray(widgets)) {
      widgets.slice(0, 6).forEach((w: any, idx: number) => {
        statsObj[`stat_${idx + 1}`] = {
          fields: {
            value: { presentation_type: "text", value_type: "custom_string", value: w.title || "" },
            label: { presentation_type: "text", value_type: "custom_string", value: w.subtitle || "" },
          },
        };
      });
    }

    const surfacesBody = {
      surfaces: {
        widget_top: {
          layout: "widget_top_hero",
          components: {
            hero_image: {
              fields: {
                image: {
                  presentation_type: "image",
                  value_type: "data",
                  value: heroImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=300&fit=crop",
                },
              },
            },
            title: {
              fields: {
                text: {
                  presentation_type: "text",
                  value_type: "custom_string",
                  value: heroTitle || "",
                },
              },
            },
          },
        },
        widget_bottom: {
          layout: "widget_bottom_stats",
          components: statsObj,
        },
        add_widget_preview: {
          layout: "add_widget_preview_hero",
          components: {
            hero_image: {
              fields: {
                image: {
                  presentation_type: "image",
                  value_type: "data",
                  value: heroImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=300&fit=crop",
                },
              },
            },
          },
        },
      },
    };

    let appId = inputAppId ? String(inputAppId).trim() : null;

    // 2. If no appId provided, create Application
    if (!appId) {
      const appRes = await fetch("https://discord.com/api/v9/applications", {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({
          name: heroTitle || `${userData.username} Widget`,
          team_id: null,
        }),
      });

      if (!appRes.ok) {
        const errJson = await appRes.json().catch(() => null);
        if (errJson?.captcha_key || errJson?.captcha_service) {
          return NextResponse.json(
            {
              error: "حماية ديسكورد (Captcha) تمنع إنشاء تطبيقات جديدة تلقائياً عبر السيرفر. استخدم 'طريقة الكونسول' الفورية بنقرة واحدة بدون كابتشا، أو أنشئ تطبيقاً في Discord Developers والصق الـ Application ID هنا.",
              isCaptcha: true,
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: `فشل إنشاء التطبيق على ديسكورد: ${JSON.stringify(errJson || "")}` },
          { status: appRes.status }
        );
      }

      const appData = await appRes.json();
      appId = appData.id;
    }

    // 3. Enable Social SDK
    await fetch(`https://discord.com/api/v9/applications/${appId}/social-sdk/enable`, {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({
        name: "Widget App",
        business_email: "support@quester.app",
        game_or_studio_name: "Quester",
        game_or_studio_url: "",
        email_updates_consent: false,
        country_or_region: "United States",
        title_role: "Founder",
        target_platforms: [],
        form_type: "Dev Solutions",
        sfdc_leadsource: "Dev Portal",
        utm_campaign: "SDK Enable Form",
      }),
    });

    // 4. Create widget-configs
    const configRes = await fetch(`https://discord.com/api/v9/applications/${appId}/widget-configs`, {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({
        display_name: heroTitle || "Profile Widget",
      }),
    });

    let configId = null;
    if (configRes.ok) {
      const configData = await configRes.json();
      configId = configData.config_id;
    }

    // 5. Patch widget config with surfaces & publish
    if (configId) {
      await fetch(`https://discord.com/api/v9/applications/${appId}/widget-configs/${configId}`, {
        method: "PATCH",
        headers: userHeaders,
        body: JSON.stringify(surfacesBody),
      });

      await fetch(`https://discord.com/api/v9/applications/${appId}/widget-configs/${configId}/publish`, {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({}),
      });
    }

    // 6. Adjust redirect URIs
    await fetch(`https://discord.com/api/v9/applications/${appId}`, {
      method: "PATCH",
      headers: userHeaders,
      body: JSON.stringify({ redirect_uris: ["https://discord.com"] }),
    });

    // 7. Authorize sdk.social_layer_presence
    await fetch(`https://discord.com/api/v9/oauth2/authorize?client_id=${appId}&response_type=token&scope=sdk.social_layer_presence`, {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({ authorize: true }),
    });

    // 8. Link Widget to user's profile
    try {
      const profRes = await fetch(`https://discord.com/api/v9/users/${userId}/profile`, {
        headers: userHeaders,
      });
      let existingWidgets: any[] = [];
      if (profRes.ok) {
        const profData = await profRes.json();
        existingWidgets = profData.widgets || [];
      }
      // Avoid duplicate
      existingWidgets = existingWidgets.filter(
        (w: any) => w?.data?.application_id !== appId
      );
      existingWidgets.unshift({ data: { type: "application", application_id: appId } });

      await fetch("https://discord.com/api/v9/users/@me/widgets", {
        method: "PUT",
        headers: userHeaders,
        body: JSON.stringify({ widgets: existingWidgets }),
      });
    } catch (e) {
      console.warn("Could not put user widgets:", e);
    }

    // 9. Reset Bot token & finalize identity
    try {
      const botRes = await fetch(`https://discord.com/api/v9/applications/${appId}/bot/reset`, {
        method: "POST",
        headers: userHeaders,
      });

      if (botRes.ok) {
        const botData = await botRes.json();
        const botToken = botData.token;

        if (botToken) {
          await fetch(`https://discord.com/api/v9/applications/${appId}/users/${userId}/identities/0/profile`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bot " + botToken,
              "User-Agent": "DiscordBot (https://github.com/discord/discord-api-docs, 1.0.0)",
            },
            body: JSON.stringify({ data: { dynamic: [] } }),
          });
        }
      }
    } catch (e) {
      console.warn("Bot finalize attempt:", e);
    }

    return NextResponse.json({
      success: true,
      message: "تم إنشاء ونشر وتطبيق الويدجيت على بروفايلك في ديسكورد بنجاح!",
      appId,
      username: userData.username,
    });
  } catch (error: any) {
    console.error("Widget apply error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ غير متوقع أثناء تطبيق الويدجيت." },
      { status: 500 }
    );
  }
}
