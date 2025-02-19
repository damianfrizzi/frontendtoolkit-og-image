import { IncomingMessage } from "http";
import { ParsedRequest, Theme } from "./types";

function fromBinary(encoded: string) {
  const binary = Buffer.from(encoded.slice(1), "base64").toString();
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return String.fromCharCode(...new Uint16Array(bytes.buffer));
}

export function parseRequest(req: IncomingMessage) {
  console.log("HTTP " + req.url);
  const url = fromBinary(req.url ?? "/");
  const search = url.slice(url.indexOf("?theme"));
  const pathname = url.replace(search, "");
  const searchParams = new URLSearchParams(search);
  const fontSize = searchParams.get("fontSize");
  const theme = searchParams.get("theme");
  const images = searchParams.getAll("images");
  const widths = searchParams.getAll("widths");
  const heights = searchParams.getAll("heights");
  const md = searchParams.get("md");

  if (Array.isArray(fontSize)) {
    throw new Error("Expected a single fontSize");
  }
  if (Array.isArray(theme)) {
    throw new Error("Expected a single theme");
  }

  const arr = (pathname || "/").split(".");

  let extension = "";
  let text = "";
  if (arr.length === 0) {
    text = "";
  } else if (arr.length === 1) {
    text = arr[0];
  } else {
    extension = arr.pop() as string;
    text = arr.join(".");
  }

  const parsedRequest: ParsedRequest = {
    fileType: extension === "jpeg" ? extension : "png",
    text: decodeURIComponent(text),
    theme: theme === "dark" ? "dark" : "light",
    md: md === "1" || md === "true",
    fontSize: fontSize || "96px",
    images: getArray(images!),
    widths: getArray(widths!),
    heights: getArray(heights!),
  };
  parsedRequest.images = getDefaultImages(
    parsedRequest.images,
    parsedRequest.theme
  );
  return parsedRequest;
}

function getArray(stringOrArray: string[] | string | undefined): string[] {
  if (typeof stringOrArray === "undefined") {
    return [];
  } else if (Array.isArray(stringOrArray)) {
    return stringOrArray;
  } else {
    return [stringOrArray];
  }
}

function getDefaultImages(images: string[], theme: Theme): string[] {
  const defaultImage =
    theme === "light"
      ? "https://www.fetoolkit.io/assets/logo-light.svg"
      : "https://www.fetoolkit.io/assets/logo-dark.svg";

  if (!images || !images[0]) {
    return [defaultImage];
  }
  if (!images[0].startsWith("https://www.fetoolkit.io/")) {
    images[0] = defaultImage;
  }
  return images;
}
