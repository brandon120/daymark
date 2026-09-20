const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "DAYMARK_API_TOKEN",
  "DAYMARK_WORKSPACE_ID",
];

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function validateStartupConfig() {
  const errors = [];

  if (!process.env.DATABASE_URL?.trim()) {
    errors.push("DATABASE_URL is required");
  }

  if (isProduction()) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]?.trim()) {
        errors.push(`${key} is required in production`);
      }
    }

    if (process.env.DAYMARK_SEED_ON_START === "1") {
      console.warn(
        "DAYMARK_SEED_ON_START=1 is enabled in production. Disable it after the first successful deploy.",
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid Daymark configuration:\n- ${errors.join("\n- ")}`);
  }

  return {
    port: Number(process.env.PORT ?? (isProduction() ? 8080 : 3001)),
    workspaceId: process.env.DAYMARK_WORKSPACE_ID ?? null,
  };
}

export function securityHeaders() {
  if (!isProduction()) {
    return {};
  }

  return {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "same-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  };
}
