import assert from "node:assert/strict";
import test from "node:test";

import { verdictFor } from "./score.ts";
import {
  applySubjective,
  argumentPenalty,
  bugPenalty,
  countOnBlur,
  countOnChange,
  initialCount,
  projectPenalty,
} from "./subjective.ts";

const neutral = { willingness: 50, argument: "nao" as const, projects: 0, bugs: 0 };

test("defaults keep the previous score", () => {
  const result = applySubjective(13, neutral);
  assert.equal(result.willingness, 0);
  assert.equal(result.argument, 0);
  assert.equal(result.projects, 0);
  assert.equal(result.bugs, 0);
  assert.equal(result.percentage, 13);
});

test("argument is 0 or −15 and does not claim a fact by itself", () => {
  assert.equal(argumentPenalty("nao"), 0);
  assert.equal(argumentPenalty("sim"), -15);
});

test("projects charge 2 each and stop the penalty at 10", () => {
  assert.equal(projectPenalty(0), 0);
  assert.equal(projectPenalty(1), -2);
  assert.equal(projectPenalty(4), -8);
  assert.equal(projectPenalty(5), -10);
  assert.equal(projectPenalty(40), -10);
});

test("bugs charge 1 each and stop the penalty at 15", () => {
  assert.equal(bugPenalty(0), 0);
  assert.equal(bugPenalty(1), -1);
  assert.equal(bugPenalty(15), -15);
  assert.equal(bugPenalty(80), -15);
  assert.equal(bugPenalty(-3), 0);
  assert.equal(bugPenalty(Number.NaN), 0);
  assert.equal(bugPenalty(Number.POSITIVE_INFINITY), 0);
  assert.equal(projectPenalty(1.5), 0);
});

test("all four deltas are added once, then clamped", () => {
  const heavy = applySubjective(13, {
    willingness: 0,
    argument: "sim",
    projects: 40,
    bugs: 80,
  });
  assert.deepEqual(
    { w: heavy.willingness, a: heavy.argument, p: heavy.projects, b: heavy.bugs },
    { w: -20, a: -15, p: -10, b: -15 },
  );
  assert.equal(heavy.raw, 13 - 20 - 15 - 10 - 15);
  assert.equal(heavy.percentage, 0);

  const eager = applySubjective(90, {
    willingness: 100,
    argument: "nao",
    projects: 0,
    bugs: 0,
  });
  assert.equal(eager.raw, 110);
  assert.equal(eager.percentage, 100);
  assert.equal(verdictFor(eager.percentage).verdict, "Pode ligar o carvão");
});

test("willingness ends still combine with the argument", () => {
  assert.equal(applySubjective(13, { ...neutral, willingness: 100 }).percentage, 33);
  assert.equal(
    applySubjective(13, { ...neutral, willingness: 100, argument: "sim" }).percentage,
    18,
  );
  assert.equal(applySubjective(13, { ...neutral, willingness: 0, argument: "sim" }).percentage, 0);
});

test("count typing keeps the last integer and blur restores junk", () => {
  const start = initialCount();
  assert.equal(start.committed, 0);
  const one = countOnChange("1", start);
  assert.deepEqual(one, { committed: 1, text: "1", invalid: false });
  const blank = countOnChange("", one);
  assert.equal(blank.committed, 1);
  assert.equal(blank.text, "");
  assert.deepEqual(countOnBlur(blank), { committed: 1, text: "1", invalid: false });

  const decimal = countOnChange("1.5", one);
  assert.equal(decimal.invalid, true);
  assert.equal(decimal.committed, 1);
  const negative = countOnChange("-2", one);
  assert.equal(negative.invalid, true);
  assert.equal(negative.committed, 1);
  assert.deepEqual(countOnBlur(negative), { committed: 1, text: "1", invalid: false });

  const overCapCount = countOnChange("40", start);
  assert.equal(overCapCount.committed, 40);
  assert.equal(projectPenalty(overCapCount.committed), -10);
});
