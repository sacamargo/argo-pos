import { describe, expect, it } from "vitest";
import {
  fulfillmentTypeToExcel,
  parseFulfillmentTypeFromExcel,
} from "@/infrastructure/excel/fulfillment-type-excel";

describe("fulfillment-type-excel", () => {
  it("maps domain types to Spanish Excel labels", () => {
    expect(fulfillmentTypeToExcel("simple")).toBe("Simple");
    expect(fulfillmentTypeToExcel("compound")).toBe("Compuesto");
  });

  it("parses Spanish and English labels", () => {
    expect(parseFulfillmentTypeFromExcel("Simple")).toBe("simple");
    expect(parseFulfillmentTypeFromExcel("simple")).toBe("simple");
    expect(parseFulfillmentTypeFromExcel("Compuesto")).toBe("compound");
    expect(parseFulfillmentTypeFromExcel("compuesto")).toBe("compound");
    expect(parseFulfillmentTypeFromExcel("compound")).toBe("compound");
  });

  it("returns null for unknown labels", () => {
    expect(parseFulfillmentTypeFromExcel("")).toBeNull();
    expect(parseFulfillmentTypeFromExcel("desconocido")).toBeNull();
  });
});
