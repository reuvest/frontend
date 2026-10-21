import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../utils/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import api from "../utils/api";
import { giftUnits, getGiftableLands } from "../services/adminService";

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mockedApi.get.mockReset();
  mockedApi.post.mockReset();
});

describe("giftUnits", () => {
  it("posts to the user's gift-units endpoint with the idempotency key header", async () => {
    mockedApi.post.mockResolvedValue({ data: { success: true, message: "ok" } });

    const res = await giftUnits(
      42,
      { land_id: 7, units: 5, reason: "Welcome gift" },
      "key-123"
    );

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/admin/users/42/gift-units",
      { land_id: 7, units: 5, reason: "Welcome gift" },
      { headers: { "Idempotency-Key": "key-123" } }
    );
    expect(res.success).toBe(true);
  });

  it("propagates API errors so the caller can decide whether to reuse the key", async () => {
    const err = { response: { status: 422, data: { message: "nope" } } };
    mockedApi.post.mockRejectedValue(err);

    await expect(
      giftUnits(1, { land_id: 1, units: 1, reason: "Some reason" }, "k")
    ).rejects.toBe(err);
  });
});

describe("getGiftableLands", () => {
  const land = (id: number, available: number) => ({
    id,
    title: `Land ${id}`,
    available_units: available,
    total_units: 100,
  });

  it("walks every page of the paginated admin lands endpoint", async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { data: { data: [land(1, 10)], last_page: 3 } } })
      .mockResolvedValueOnce({ data: { data: { data: [land(2, 5)], last_page: 3 } } })
      .mockResolvedValueOnce({ data: { data: { data: [land(3, 1)], last_page: 3 } } });

    const lands = await getGiftableLands();

    expect(mockedApi.get).toHaveBeenCalledTimes(3);
    expect(mockedApi.get).toHaveBeenNthCalledWith(1, "/admin/lands?page=1");
    expect(mockedApi.get).toHaveBeenNthCalledWith(3, "/admin/lands?page=3");
    expect(lands.map((l) => l.id)).toEqual([1, 2, 3]);
  });

  it("drops sold-out lands", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: { data: [land(1, 0), land(2, 4)], last_page: 1 } },
    });

    const lands = await getGiftableLands();

    expect(lands.map((l) => l.id)).toEqual([2]);
  });

  it("handles a single-page response with no last_page", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { data: [land(9, 2)] } } });

    const lands = await getGiftableLands();

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(lands).toHaveLength(1);
  });
});
