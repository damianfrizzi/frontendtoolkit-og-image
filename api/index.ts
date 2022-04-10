import { IncomingMessage, ServerResponse } from "http";
import { parseRequest } from "./_lib/parser";
import { getScreenshot, getScreenshotByUrl } from "./_lib/chromium";
import { getHtml } from "./_lib/template";

const isDev = !process.env.AWS_REGION;
const isHtmlDebug = process.env.OG_HTML_DEBUG === "1";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    if (req.url?.includes("screenshot.png")) {
      const url = req.url;
      const fileType = "png";
      const search = url.slice(url.indexOf("?screenshotUrl"));
      const searchParams = new URLSearchParams(search);
      const screenshotUrl = searchParams.get("screenshotUrl");
      const theme = searchParams.get("theme");

      if (!screenshotUrl || !theme) {
        throw new Error("Invalid parameters");
      }

      const file = await getScreenshotByUrl(
        screenshotUrl,
        theme,
        fileType,
        isDev
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", `image/${fileType}`);
      res.setHeader(
        "Cache-Control",
        `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
      );
      res.end(file);

      return;
    }
    const parsedReq = parseRequest(req);
    const html = getHtml(parsedReq);
    if (isHtmlDebug) {
      res.setHeader("Content-Type", "text/html");
      res.end(html);
      return;
    }
    const { fileType } = parsedReq;
    const file = await getScreenshot(html, fileType, isDev);
    res.statusCode = 200;
    res.setHeader("Content-Type", `image/${fileType}`);
    res.setHeader(
      "Cache-Control",
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
    );
    res.end(file);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html");
    res.end("<h1>Internal Error</h1><p>Sorry, there was a problem</p>");
    console.error(e);
  }
}
