export function hex2a(hexx: string) {
  let hex = hexx.toString();
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

export function joinUrl(base: URL | Location, path: string) {
  let str = "";

  str = str + base.protocol;
  str = str + "//";
  str = str + base.hostname;
  str = str + base.port.length ? ":" + base.port : "";
  str = str + base.pathname;
  str = str + base.pathname.endsWith("/") ? "" : "/";
  str = str + path.replace(/^\//, "");

  return str;
}

export function shortName(name: string | number | undefined) {
  if (typeof name !== "number" && !name?.length) return "?";
  const split = String(name).split(/\s+/g);
  if (split.length === 2) return `${split[0][0]}${split[1][0]}`.toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
}
