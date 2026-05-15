import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { FACTIONS, getFaction } from "../lib/factions.js";
import { getDetachments, getEnhancements, getUnits, ROLE_ORDER } from "../lib/catalogue.js";

const app = new Hono();

/**
 * GET /catalogue/factions — full faction list (cheap, cacheable).
 */
app.get("/factions", (c) => {
  c.header("Cache-Control", "public, max-age=3600");
  return c.json({ factions: FACTIONS });
});

/**
 * GET /catalogue/factions/:id — faction metadata + detachments + units.
 */
app.get("/factions/:id", (c) => {
  const id = c.req.param("id");
  const faction = getFaction(id);
  if (!faction) throw new HTTPException(404, { message: "Faction not found." });

  c.header("Cache-Control", "public, max-age=3600");
  return c.json({
    faction,
    detachments: getDetachments(id),
    enhancements: getEnhancements(id),
    units: getUnits(id),
    roleOrder: ROLE_ORDER,
  });
});

export default app;
