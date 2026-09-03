import { describe, it, expect, beforeEach } from "vitest";
import { isAuthed, clearAuthedFlag } from "../utils/tokenStore";

function setCookie(str: string) {
  document.cookie = str;
}

function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
}

describe("tokenStore", () => {
  beforeEach(() => {
    clearAllCookies();
  });

  describe("isAuthed", () => {
    it("returns false when the is_authed cookie is absent", () => {
      expect(isAuthed()).toBe(false);
    });

    it("returns true when is_authed=1", () => {
      setCookie("is_authed=1");
      expect(isAuthed()).toBe(true);
    });

    it("returns false for any value other than exactly '1'", () => {
      setCookie("is_authed=true");
      expect(isAuthed()).toBe(false);
    });

    it("only reads is_authed, never auth_token or user_role (httpOnly, not JS-readable anyway)", () => {
      // These would never actually be readable client-side since the API
      // sets them httpOnly, but this guards against a regression where
      // this file starts reading them again.
      setCookie("auth_token=some-jwt");
      setCookie("user_role=admin");
      expect(isAuthed()).toBe(false);
    });

    it("correctly picks is_authed out among multiple cookies", () => {
      setCookie("foo=bar");
      setCookie("is_authed=1");
      setCookie("baz=qux");
      expect(isAuthed()).toBe(true);
    });
  });

  describe("clearAuthedFlag", () => {
    it("removes the is_authed cookie", () => {
      setCookie("is_authed=1");
      expect(isAuthed()).toBe(true);
      clearAuthedFlag();
      expect(isAuthed()).toBe(false);
    });

    it("is a no-op when the cookie was never set", () => {
      expect(() => clearAuthedFlag()).not.toThrow();
      expect(isAuthed()).toBe(false);
    });
  });
});
