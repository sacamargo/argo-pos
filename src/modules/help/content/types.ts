export type HelpField = {
  name: string;
  expects: string;
  notes?: string;
};

export type HelpAction = {
  name: string;
  does: string;
};

/** Media under /help/* (png, webp, gif, svg). Offline, bundled with the app. */
export type HelpVisualStep = {
  title: string;
  body: string;
  /** Absolute public path, e.g. `/help/pos-cobrar.svg` */
  mediaSrc?: string;
  mediaAlt?: string;
};

export type HelpModule = {
  id: string;
  title: string;
  audience: "todos" | "admin" | "vendedor+admin";
  summary: string;
  whenToUse: string;
  visualSteps?: HelpVisualStep[];
  fields: HelpField[];
  actions: HelpAction[];
  tips?: string[];
};
