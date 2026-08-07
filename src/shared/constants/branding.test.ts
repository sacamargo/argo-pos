import { describe, expect, it } from "vitest";
import {
  APP_PRODUCT_NAME,
  BUSINESS_NAME,
  formatAppTitle,
} from "@/shared/constants/branding";

describe("branding", () => {
  it("formats app title with business name", () => {
    expect(formatAppTitle()).toBe(`${APP_PRODUCT_NAME} - ${BUSINESS_NAME}`);
    expect(formatAppTitle("Demo Bar")).toBe("Argo POS - Demo Bar");
  });
});
