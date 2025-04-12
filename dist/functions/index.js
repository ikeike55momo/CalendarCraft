// netlify/functions/index.ts
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.VITE_SUPABASE_URL || "";
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
var supabase = createClient(supabaseUrl, supabaseServiceKey);
var app = express();
app.use(cors());
app.use(express.json());
app.post("/export-calendar", async (req, res) => {
  try {
    console.log("=== export-calendar \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u958B\u59CB ===");
    const { includePersonalEvents = true, includeTasks = true, days = 20 } = req.body;
    const authHeader = req.headers.authorization;
    console.log("\u30EA\u30AF\u30A8\u30B9\u30C8\u60C5\u5831:", {
      includePersonalEvents,
      includeTasks,
      days,
      hasAuthHeader: !!authHeader
    });
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u304C\u3042\u308A\u307E\u305B\u3093");
      return res.status(401).json({ error: "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u304C\u3042\u308A\u307E\u305B\u3093" });
    }
    const token = authHeader.split(" ")[1];
    console.log("Bearer\u30C8\u30FC\u30AF\u30F3:", token.substring(0, 10) + "...");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log("Supabase \u30BB\u30C3\u30B7\u30E7\u30F3\u60C5\u5831:", {
      hasSession: !!sessionData.session,
      hasProviderToken: !!sessionData.session?.provider_token,
      providerTokenLength: sessionData.session?.provider_token?.length,
      error: sessionError
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log("\u30E6\u30FC\u30B6\u30FC\u60C5\u5831:", {
      id: user?.id,
      email: user?.email,
      appMetadata: user?.app_metadata,
      userMetadata: user?.user_metadata,
      error: userError
    });
    if (userError || !user) {
      console.error("\u30E6\u30FC\u30B6\u30FC\u53D6\u5F97\u30A8\u30E9\u30FC:", userError);
      return res.status(401).json({ error: "\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
    const { data: userData, error: userDataError } = await supabase.from("users").select("*").eq("google_sub", user.id).single();
    console.log("\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u30E6\u30FC\u30B6\u30FC\u60C5\u5831:", {
      found: !!userData,
      id: userData?.id,
      googleSub: userData?.google_sub,
      hasGoogleToken: !!userData?.google_access_token,
      googleTokenLength: userData?.google_access_token?.length,
      error: userDataError
    });
    if (userDataError || !userData) {
      console.error("\u30E6\u30FC\u30B6\u30FC\u60C5\u5831\u53D6\u5F97\u30A8\u30E9\u30FC:", userDataError);
      return res.status(401).json({ error: "\u30E6\u30FC\u30B6\u30FC\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
    if (!userData.google_access_token) {
      console.error("Google\u30A2\u30AF\u30BB\u30B9\u30C8\u30FC\u30AF\u30F3\u304C\u5B58\u5728\u3057\u307E\u305B\u3093");
      return res.status(401).json({ error: "Google\u30A2\u30AF\u30BB\u30B9\u30C8\u30FC\u30AF\u30F3\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    console.log("\u8A8D\u8A3C\u60C5\u5831:", {
      googleSub: user.id,
      userId: userData.id,
      hasGoogleToken: !!userData.google_access_token,
      tokenType: token ? "Bearer" : "none"
    });
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: userData.google_access_token
    });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const newCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: "\u308F\u3069\u30C1\u30FC\u30E0",
        description: "\u308F\u3069\u30C1\u30FC\u30E0\u30B9\u30B1\u30B8\u30E5\u30FC\u30E9\u30FC\u304B\u3089\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3055\u308C\u305F\u30AB\u30EC\u30F3\u30C0\u30FC",
        timeZone: "Asia/Tokyo"
      }
    });
    const calendarId = newCalendar.data.id;
    if (!calendarId) {
      throw new Error("\u30AB\u30EC\u30F3\u30C0\u30FCID\u304C\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    }
    const today = /* @__PURE__ */ new Date();
    const endDate = /* @__PURE__ */ new Date();
    endDate.setDate(today.getDate() + days);
    let events = [];
    if (includePersonalEvents) {
      const { data: eventsData, error: eventsError } = await supabase.from("events").select("*").eq("user_id", user.id).gte("date", today.toISOString().split("T")[0]).lte("date", endDate.toISOString().split("T")[0]);
      if (eventsError) {
        console.error("\u30A4\u30D9\u30F3\u30C8\u53D6\u5F97\u30A8\u30E9\u30FC:", eventsError);
      } else {
        events = eventsData || [];
      }
    }
    let tasks = [];
    if (includeTasks) {
      const { data: tasksData, error: tasksError } = await supabase.from("tasks").select("*").eq("user_id", user.id).gte("due_date", today.toISOString().split("T")[0]).lte("due_date", endDate.toISOString().split("T")[0]);
      if (tasksError) {
        console.error("\u30BF\u30B9\u30AF\u53D6\u5F97\u30A8\u30E9\u30FC:", tasksError);
      } else {
        tasks = tasksData || [];
      }
    }
    const eventPromises = events.map(async (event) => {
      try {
        const startTime = event.start_time || event.startTime;
        const endTime = event.end_time || event.endTime;
        const workType = event.work_type || event.workType;
        let colorId = "1";
        if (workType === "office" || workType === "\u51FA\u52E4" || workType === "\u51FA\u793E") {
          colorId = "9";
        } else if (workType === "remote" || workType === "\u30C6\u30EC\u30EF\u30FC\u30AF") {
          colorId = "10";
        }
        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary: `[${workType}] ${event.title}`,
            description: event.detail || "",
            start: {
              dateTime: startTime,
              timeZone: "Asia/Tokyo"
            },
            end: {
              dateTime: endTime,
              timeZone: "Asia/Tokyo"
            },
            colorId
          }
        });
        return { id: event.id, success: true };
      } catch (error) {
        console.error("\u30A4\u30D9\u30F3\u30C8\u8FFD\u52A0\u30A8\u30E9\u30FC:", error);
        return { id: event.id, success: false, error };
      }
    });
    const taskPromises = tasks.map(async (task) => {
      try {
        const dueDate = task.due_date || task.dueDate;
        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary: `[\u30BF\u30B9\u30AF] ${task.title}`,
            description: task.detail || "",
            start: {
              date: dueDate.split("T")[0],
              timeZone: "Asia/Tokyo"
            },
            end: {
              date: dueDate.split("T")[0],
              timeZone: "Asia/Tokyo"
            },
            colorId: "5"
            // 黄色
          }
        });
        return { id: task.id, success: true };
      } catch (error) {
        console.error("\u30BF\u30B9\u30AF\u8FFD\u52A0\u30A8\u30E9\u30FC:", error);
        return { id: task.id, success: false, error };
      }
    });
    const [eventResults, taskResults] = await Promise.all([
      Promise.all(eventPromises),
      Promise.all(taskPromises)
    ]);
    const successfulEvents = eventResults.filter((r) => r.success).length;
    const successfulTasks = taskResults.filter((r) => r.success).length;
    return res.status(200).json({
      success: true,
      calendarId,
      calendarUrl: `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`,
      stats: {
        events: {
          total: events.length,
          exported: successfulEvents
        },
        tasks: {
          total: tasks.length,
          exported: successfulTasks
        }
      }
    });
  } catch (error) {
    console.error("\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u51E6\u7406\u30A8\u30E9\u30FC:", error);
    return res.status(500).json({ error: `\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u51E6\u7406\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F: ${error}` });
  }
});
var handler = async (event, context) => {
  const serverlessHandler = serverless(app);
  const response = await serverlessHandler(event, context);
  return {
    statusCode: response.statusCode || 200,
    headers: response.headers || {},
    body: response.body || "",
    isBase64Encoded: response.isBase64Encoded || false
  };
};
export {
  handler
};
