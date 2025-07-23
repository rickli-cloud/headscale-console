import { selfserviceCap } from "$lib/store/selfservice";
import { appConfig } from "$lib/store/config";
import { get } from "svelte/store";

export class SelfService {
  public static async expireNode(id: string): Promise<void> {
    const host = get(appConfig).selfserviceHostname;

    if (!host) {
      throw new Error("Self-Service hostname undefined");
    }

    const res = await window.ipn.fetch({
      headers: { "Sec-Fetch-Site": ["same-origin"] },
      url: `http://${host}/api/v1/node/${id}`,
      method: "PATCH",
    });

    if (res.status !== 200) {
      throw new Error("Server error: " + res.status, { cause: res.text() });
    }
  }

  public static async deleteNode(id: string): Promise<void> {
    const host = get(appConfig).selfserviceHostname;
    const cap = get(selfserviceCap);

    if (!host) {
      throw new Error("Self-Service hostname undefined");
    }
    if (!cap) {
      throw new Error("Self-Service capabilities is undefined");
    }
    if (!cap.nodeDeletion) {
      throw new Error("Node deletion is not allowed");
    }

    const res = await window.ipn.fetch({
      headers: { "Sec-Fetch-Site": ["same-origin"] },
      url: `http://${host}/api/v1/node/${id}`,
      method: "DELETE",
    });

    if (res.status !== 200) {
      throw new Error("Server error: " + res.status, { cause: res.text() });
    }
  }

  public static async getAuthkeys(): Promise<Preauthkey[]> {
    const host = get(appConfig).selfserviceHostname;

    if (!host) {
      throw new Error("Self-Service hostname undefined");
    }

    const res = await window.ipn.fetch({
      headers: { "Sec-Fetch-Site": ["same-origin"] },
      url: `http://${host}/api/v1/authkey`,
      method: "GET",
    });

    if (res.status !== 200) {
      throw new Error("Server error: " + res.status, { cause: res.text() });
    }

    return JSON.parse(await res.text());
  }

  public static async createAuthkey(opt: {
    reusable?: boolean;
    ephemeral?: boolean;
    expiration?: Date;
  }): Promise<{ key?: string; exp?: string; id?: string }> {
    const host = get(appConfig).selfserviceHostname;
    const cap = get(selfserviceCap);

    if (!host) {
      throw new Error("Self-Service hostname undefined");
    }
    if (!cap) {
      throw new Error("Self-Service capabilities is undefined");
    }
    if (!cap.authkeys) {
      throw new Error("Authkeys creation is not allowed");
    }

    const url = new URL(`http://${host}/api/v1/authkey`);
    if (opt.reusable) {
      url.searchParams.set("reusable", String(opt.reusable));
    }
    if (opt.ephemeral) {
      url.searchParams.set("ephemeral", String(opt.ephemeral));
    }
    if (opt.expiration) {
      url.searchParams.set("expiration", opt.expiration.toISOString());
    }

    console.debug("CreateAuthkey", url.toString());

    const res = await window.ipn.fetch({
      headers: { "Sec-Fetch-Site": ["same-origin"] },
      url: url.toString(),
      method: "PUT",
    });

    if (res.status !== 200) {
      throw new Error("Server error: " + res.status, { cause: res.text() });
    }

    return JSON.parse(await res.text());
  }

  public static async expireAuthkey(key: string): Promise<void> {
    const host = get(appConfig).selfserviceHostname;

    if (!host) {
      throw new Error("Self-Service hostname undefined");
    }

    const res = await window.ipn.fetch({
      headers: { "Sec-Fetch-Site": ["same-origin"] },
      url: `http://${host}/api/v1/authkey/${key}`,
      method: "PATCH",
    });

    if (res.status !== 200) {
      throw new Error("Server error: " + res.status, { cause: res.text() });
    }
  }

  public static async getCap(): Promise<SelfserviceCap> {
    const host = get(appConfig).selfserviceHostname;

    if (!host) {
      throw new Error("Self-Service hostname undefined");
    }

    const res = await window.ipn.fetch({
      headers: { "Sec-Fetch-Site": ["same-origin"] },
      url: `http://${host}/api/v1/cap`,
    });

    if (res.status !== 200) {
      throw new Error("Server error: " + res.status);
    }

    return JSON.parse(await res.text());
  }
}

export interface SelfserviceCap {
  authkeys: boolean;
  nodeDeletion: boolean;
}

export interface Preauthkey {
  id: string;
  key: string;
  /** Date */
  expiration: string;
  /** Date */
  createdAt: string;
  reusable: boolean;
  ephemeral: boolean;
  used: boolean;
  tags: string[] | null;
}
