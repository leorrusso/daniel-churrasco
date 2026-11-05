import assert from "node:assert/strict";
import test from "node:test";

import { verdictFor } from "./score.ts";
import {
  applyWillingness,
  initialWillingness,
  willingnessContribution,
  willingnessFromSlider,
  willingnessOnBlur,
  willingnessOnChange,
} from "./willingness.ts";

test("50 is neutral and the ends are ±20", () => {
  assert.equal(willingnessContribution(50), 0);
  assert.equal(willingnessContribution(0), -20);
  assert.equal(willingnessContribution(100), 20);
});

test("the map is linear between the ends", () => {
  assert.equal(willingnessContribution(25), -10);
  assert.equal(willingnessContribution(75), 10);
  assert.equal(willingnessContribution(12), -15);
});

test("out of range and non-numbers clamp before they score", () => {
  assert.equal(willingnessContribution(-5), -20);
  assert.equal(willingnessContribution(150), 20);
  assert.equal(willingnessContribution(Number.NaN), 0);
  assert.equal(willingnessContribution(Number.POSITIVE_INFINITY), 0);
});

test("final chance clamps to 0..100 after the palpite", () => {
  assert.deepEqual(applyWillingness(13, 50), { contribution: 0, raw: 13, percentage: 13 });
  assert.deepEqual(applyWillingness(13, 0), { contribution: -20, raw: -7, percentage: 0 });
  assert.deepEqual(applyWillingness(13, 100), { contribution: 20, raw: 33, percentage: 33 });
  assert.equal(applyWillingness(90, 100).percentage, 100);
  assert.equal(applyWillingness(90, 100).raw, 110);
});

test("verdict follows the adjusted percentage", () => {
  assert.equal(verdictFor(applyWillingness(13, 50).percentage).verdict, "O Daniel vai ficar no sofá");
  assert.equal(verdictFor(applyWillingness(13, 100).percentage).verdict, "Hoje é dia de delivery");
});

test("the default control is 50 and does not look invalid", () => {
  assert.deepEqual(initialWillingness(), { committed: 50, text: "50", invalid: false });
});

test("slider writes the same number into the field", () => {
  assert.deepEqual(willingnessFromSlider(0), { committed: 0, text: "0", invalid: false });
  assert.deepEqual(willingnessFromSlider(100), { committed: 100, text: "100", invalid: false });
  assert.deepEqual(willingnessFromSlider(150), { committed: 100, text: "100", invalid: false });
});

test("typing a valid number updates immediately and blank does not", () => {
  const start = initialWillingness();
  const five = willingnessOnChange("5", start);
  assert.equal(five.committed, 5);
  assert.equal(five.invalid, false);
  const blank = willingnessOnChange("", five);
  assert.equal(blank.committed, 5);
  assert.equal(blank.text, "");
  assert.equal(blank.invalid, false);
  assert.equal(willingnessContribution(blank.committed), willingnessContribution(5));
});

test("out of range, NaN-like text, and blur clamp or restore", () => {
  const atTwenty = willingnessOnChange("20", initialWillingness());
  const tooHigh = willingnessOnChange("200", atTwenty);
  assert.equal(tooHigh.invalid, true);
  assert.equal(tooHigh.committed, 20);
  assert.deepEqual(willingnessOnBlur(tooHigh), { committed: 100, text: "100", invalid: false });

  const negative = willingnessOnChange("-5", initialWillingness());
  assert.equal(negative.invalid, true);
  assert.equal(negative.committed, 50);
  assert.deepEqual(willingnessOnBlur(negative), { committed: 50, text: "50", invalid: false });

  const blank = willingnessOnChange("", willingnessFromSlider(80));
  assert.deepEqual(willingnessOnBlur(blank), { committed: 80, text: "80", invalid: false });

  const junk = willingnessOnChange("abc", willingnessFromSlider(10));
  assert.equal(junk.invalid, true);
  assert.deepEqual(willingnessOnBlur(junk), { committed: 10, text: "10", invalid: false });
});
