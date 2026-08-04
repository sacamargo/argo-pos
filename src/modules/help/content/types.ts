export type HelpField = {
  name: string;
  expects: string;
  notes?: string;
};

export type HelpAction = {
  name: string;
  does: string;
};

export type HelpModule = {
  id: string;
  title: string;
  audience: "todos" | "admin" | "vendedor+admin";
  summary: string;
  whenToUse: string;
  fields: HelpField[];
  actions: HelpAction[];
  tips?: string[];
};
